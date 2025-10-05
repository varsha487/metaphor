from flask import Flask, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
from google import genai
import base64
from google.genai import types
import wave
import io
import json
import requests
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from dotenv import load_dotenv
import os

load_dotenv()  # loads from .env automatically

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
API_KEY = os.getenv("API_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")  # store in .env
RAPIDAPI_HOST = "project-gutenberg-free-books-api1.p.rapidapi.com"


app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
CORS(app)

from models import Book 
from models import BookImage 
from models import BookAudio
from models import BookNote
from models import Analysis
from models import BookMusic

@app.route("/api/fetch_book_text/<int:book_id>", methods=["GET"])
def fetch_book_text(book_id):
    try:
        url = f"https://project-gutenberg-free-books-api1.p.rapidapi.com/books/{book_id}/text"
        headers = {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": "project-gutenberg-free-books-api1.p.rapidapi.com"
        }
        params = {"cleaning_mode": "super"}
        response = requests.get(url, headers=headers, params=params)
        
        response.raise_for_status()
        data = response.json()
        print(data)
        return jsonify({
            "title": data.get("title", ""),
            "content": data.get("text", "")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/annotations_pdf/<int:book_id>", methods=["GET"])
def generate_annotations_pdf(book_id):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Fetch annotations
    from models import BookNote, Analysis, BookImage, BookMusic
    notes = BookNote.query.filter_by(book_id=book_id).all()
    analyses = Analysis.query.filter_by(book_id=book_id).all()
    images = BookImage.query.filter_by(book_id=book_id).all()
    music = BookMusic.query.filter_by(book_id=book_id).all()

    story.append(Paragraph(f"Annotations for Book {book_id}", styles['Title']))
    story.append(Spacer(1, 12))

    for note in notes:
        story.append(Paragraph(f"<b>Note (Page {note.page_number}):</b> {note.content}", styles['Normal']))
        story.append(Spacer(1, 8))

    for analysis in analyses:
        story.append(Paragraph(f"<b>Analysis (Page {analysis.page_number}):</b> {analysis.content}", styles['Normal']))
        story.append(Spacer(1, 8))

    for img in images:
        img_data = base64.b64decode(img.image_base64)
        img_buffer = io.BytesIO(img_data)
        story.append(Paragraph(f"<b>Image (Page {img.page_number}):</b>", styles['Normal']))
        story.append(Image(img_buffer, width=400, height=300))
        story.append(Spacer(1, 12))

    for m in music:
        try:
            songs = json.loads(m.songs_json or "[]")
            for song in songs:
                story.append(Paragraph(f"Song Recommendation (Page {m.page_number}):", styles['Normal']))
                story.append(Paragraph(f"🎵 {song['title']} — {song['artist']}", styles['Normal']))
        except:
            pass
        story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name=f"book_{book_id}_annotations.pdf", mimetype="application/pdf")

def get_access_token():
    """
    Get Spotify access token using Client Credentials flow
    """
    auth_url = "https://accounts.spotify.com/api/token"
    auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode("utf-8")

    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "client_credentials"
    }

    response = requests.post(auth_url, headers=headers, data=data)
    response.raise_for_status()

    token_info = response.json()
    return token_info["access_token"]

def search_spotify(query, limit=5):
    """
    Search Spotify API for tracks, artists, albums, etc.
    """
    access_token = get_access_token()
    search_url = "https://api.spotify.com/v1/search"

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    limit = 1

    params = {
        "q": query,
        "type": 'track',
        "limit": limit
    }

    response = requests.get(search_url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()


@app.route("/api/ask_gemini", methods=["POST"])
def ask_gemini():
    data = request.get_json()
    title = data["title"]
    message = data["message"]
    text = data.get("text", "")

    prompt = f"Text: {text} Question: {message} Answer the question based on the text in one sentence:"

    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
           model="gemini-2.5-flash",
           contents=prompt
       )


    return jsonify({"reply": response.text})

@app.route("/api/generate_music", methods=["POST"])
def generate_music():
    data = request.get_json()
    text = data.get("text", "")
    title = data.get("title", "")
    page_number = data.get("page_number", 0)
    book_id = data.get("book_id", None)

    # 1️⃣ Check if music already exists
    existing = BookMusic.query.filter_by(book_id=book_id, page_number=page_number).first()
    if existing:
        return jsonify({"status": "ok", "songs": json.loads(existing.songs_json)})

    # 2️⃣ Generate with Gemini
    prompt = f"""
    You are a music expert. Suggest 3-5 songs that match the mood, tone, or theme of this text from the book "{title}".
    Return the output **strictly in JSON** as a list of objects with the following format:
    [
      {{"title": "Song Title", "artist": "Artist Name"}}
    ] Text excerpt:
    {text}
    """
    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    songs = response.text.strip()
    if songs.startswith("```json"):
        songs = songs.replace("```json", "").replace("```", "").strip()
    songs = json.loads(songs)

    # 3️⃣ Enrich with Spotify URLs
    for song in songs:
        query = f"{song['title']} {song.get('artist', '')}"
        search_results = search_spotify(query)
        items = search_results.get("tracks", {}).get("items", [])
        if items:
            track = items[0]
            song["spotify_url"] = track["external_urls"]["spotify"]
        else:
            song["spotify_url"] = None

    # 4️⃣ Save to DB
    new_music = BookMusic(
        book_id=book_id,
        page_number=page_number,
        songs_json=json.dumps(songs)
    )
    db.session.add(new_music)
    db.session.commit()

    return jsonify({"status": "ok", "songs": songs})



@app.route("/api/analyses", methods=["POST"])
def save_analysis():
    data = request.json
    new_analysis = Analysis(
        book_id=data["book_id"],
        page_number=data["page_number"],
        content=data["analysis"]
    )
    db.session.add(new_analysis)
    db.session.commit()
    return jsonify({"status": "success", "analysis_id": new_analysis.id})

# Get all analyses for a page
@app.route("/api/analyses/<int:book_id>/<int:page_number>", methods=["GET"])
def get_analyses(book_id, page_number):
    analyses = Analysis.query.filter_by(book_id=book_id, page_number=page_number).order_by(Analysis.created_at.desc()).all()
    return jsonify([{"id": a.id, "content": a.content, "created_at": a.created_at.isoformat()} for a in analyses])

@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    result = []
    for book in books:
        titles = book.title.split(";")
        clean_title = titles[0].strip() if titles else book.title
        book_dict = book.to_dict()
        book_dict['title'] = clean_title
        result.append(book_dict)
    return jsonify(result)

@app.route("/api/books", methods=["POST"])
def add_book():
    data = request.get_json()
    book_id = data.get("id")
    title = data.get("title")
    content = data.get("content", "")

    # Check if book already exists
    existing = Book.query.get(book_id)
    if existing:
        return jsonify({"status": "exists", "book": existing.to_dict()})

    # Add new book
    new_book = Book(id=book_id, title=title, content=content)
    db.session.add(new_book)
    db.session.commit()

    return jsonify({"status": "ok", "book": new_book.to_dict()})


@app.route("/api/notes/<int:book_id>/<int:page_number>", methods=["GET"])
def get_notes(book_id, page_number):
    notes = BookNote.query.filter_by(book_id=book_id, page_number=page_number).all()
    return jsonify([{"id": n.id, "content": n.content, "timestamp": n.timestamp} for n in notes])

@app.route("/api/notes", methods=["POST"])
def add_note():
    data = request.get_json()
    book_id = data.get("book_id")
    page_number = data.get("page_number")
    content = data.get("content", "")

    if not content.strip():
        return jsonify({"status": "error", "message": "Note cannot be empty"}), 400

    note = BookNote(book_id=book_id, page_number=page_number, content=content)
    db.session.add(note)
    db.session.commit()

    return jsonify({"status": "ok", "note": {"id": note.id, "content": note.content, "timestamp": note.timestamp}})


@app.route("/api/books/<int:book_id>")
def get_book(book_id):
    book = Book.query.get_or_404(book_id)
    titles = book.title.split(";")
    title = titles[0].strip() if titles else book.title
    return jsonify({"id": book.id, "title": title, "content": book.content})

def wave_file_bytes(pcm, channels=1, rate=24000, sample_width=2):
   """Return WAV bytes from PCM data (in memory)."""
   with io.BytesIO() as buf:
       with wave.open(buf, "wb") as wf:
           wf.setnchannels(channels)
           wf.setsampwidth(sample_width)
           wf.setframerate(rate)
           wf.writeframes(pcm)
       return buf.getvalue()
   
@app.route("/api/render_sound", methods=["POST"])
def render_sound():
    data = request.get_json()
    text = data.get("text", "")
    page_number = data.get("page_number")
    book_id = data.get("book_id")

    existing = BookAudio.query.filter_by(book_id=book_id, page_number=page_number).first()
    if existing:
        return jsonify({"status": "ok", "audio_base64": existing.audio_base64})
    

    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=f"Read the following text beautifully, in a 20th-century literature style: {text}",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="aoede"
                    )
                )
            )
        )
    )
    # Extract PCM bytes
    pcm_data = response.candidates[0].content.parts[0].inline_data.data
    print("PCM length:", len(pcm_data))
    # Convert PCM to WAV in memory
    wav_bytes = wave_file_bytes(pcm_data)
    # Encode WAV to base64 for browser
    b64_audio = base64.b64encode(wav_bytes).decode("utf-8")
    
    new_audio = BookAudio(
        book_id=book_id,
        page_number=page_number,
        audio_base64=b64_audio
    )
    db.session.add(new_audio)
    db.session.commit()
    
    return jsonify({"status": "ok", "audio_base64": b64_audio})

@app.route("/api/analyze_text", methods=["POST"])
def analyze_text():
    data = request.get_json()
    text = data.get("text", "")
    title = data.get("title", "")
    print("here")
    prompt = f"I am reading a book and I want an analysis and explanation of the confusing parts of the following text from {title}. Return your response in a JSON format where the key is the sentence or phrase you are analyzing, and the value is analysis you provide. The last entry in the JSON object should be 'summary' and contain a short one-sentence summary of the passage. Here is the text: {text}"
    
    client = genai.Client(api_key=API_KEY)

    response = client.models.generate_content(
           model="gemini-2.5-flash",
           contents=prompt
       )
    
    summary = response.text
    print("Summary:", summary)
    return jsonify({"status": "ok", "analysis": summary})

@app.route("/api/annotations/<int:book_id>", methods=["GET"])
def get_annotations(book_id):
    from models import BookNote, Analysis, BookImage, BookAudio, BookMusic

    notes = BookNote.query.filter_by(book_id=book_id).all()
    analyses = Analysis.query.filter_by(book_id=book_id).all()
    images = BookImage.query.filter_by(book_id=book_id).all()
    audios = BookAudio.query.filter_by(book_id=book_id).all()
    music = BookMusic.query.filter_by(book_id=book_id).all()

    return jsonify({
        "notes": [{"page_number": n.page_number, "content": n.content} for n in notes],
        "analyses": [{"page_number": a.page_number, "content": a.content} for a in analyses],
        "images": [{"page_number": i.page_number, "image_base64": i.image_base64} for i in images],
        "audios": [{"page_number": a.page_number, "audio_base64": a.audio_base64} for a in audios],
        "music": [{"page_number": m.page_number, "songs_json": m.songs_json} for m in music]
    })


@app.route("/api/render_text", methods=["POST"])
def render_text():
    data = request.get_json()
    text = data.get("text", "")
    title = data.get("title", "")
    page_number = data.get("page_number")  # must be passed from frontend
    book_id = data.get("book_id")          # also passed from frontend
    prompt = f"I am reading a book and I want an image that represents the text from {title}. If the following text is just table of contents, then do not generate an image. Do not include any text on the image. Here is the text: {text}"
    
    # 1. Check if image exists
    existing = BookImage.query.filter_by(book_id=book_id, page_number=page_number).first()
    if existing:
        return jsonify({"status": "ok", "image_base64": existing.image_base64})

    # 2. Generate new image
    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_images(
        model='imagen-4.0-generate-001',
        prompt=prompt,
        config=types.GenerateImagesConfig(number_of_images=1)
    )
    img_bytes = response.generated_images[0].image.image_bytes
    img_base64 = base64.b64encode(img_bytes).decode("utf-8")

    # 3. Save to DB
    new_image = BookImage(
        book_id=book_id,
        page_number=page_number,
        image_base64=img_base64
    )
    db.session.add(new_image)
    db.session.commit()

    return jsonify({"status": "ok", "image_base64": img_base64})



if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
