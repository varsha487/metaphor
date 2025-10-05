from app import db
from datetime import datetime

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)  # This can store large amounts of text 
       
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content
        }
    
class BookImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"), nullable=False)
    page_number = db.Column(db.Integer, nullable=False)
    image_base64 = db.Column(db.Text, nullable=False)

    book = db.relationship("Book", backref=db.backref("images", lazy=True))

class BookAudio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"), nullable=False)
    page_number = db.Column(db.Integer, nullable=False)
    audio_base64 = db.Column(db.Text, nullable=False)


class BookNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, nullable=False)
    page_number = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.now())

class Analysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, nullable=False)
    page_number = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)  # JSON string of analysis
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BookMusic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    page_number = db.Column(db.Integer, nullable=False)
    songs_json = db.Column(db.Text, nullable=False)  # JSON string of the recommended songs
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "book_id": self.book_id,
            "page_number": self.page_number,
            "songs": json.loads(self.songs_json),
            "created_at": self.created_at.isoformat()
        }