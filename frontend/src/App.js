import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import './App.css';
import Home from "./Home";
import AnalysisDisplay from "./Analysis_Display";
import ReactMarkdown from "react-markdown";
import SpotifyEmbed from './SpotifyEmbed';


function Loader() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%"
    }}>
      <div className="loader"></div>
      <style>
        {`
          .loader {
            width: 50px;
            padding: 8px;
            aspect-ratio: 1;
            border-radius: 50%;
            background: #25b09b;
            --_m: 
              conic-gradient(#0000 10%,#000),
              linear-gradient(#000 0 0) content-box;
            -webkit-mask: var(--_m);
                    mask: var(--_m);
            -webkit-mask-composite: source-out;
                    mask-composite: subtract;
            animation: l3 1s infinite linear;
          }
          @keyframes l3 {
            to { transform: rotate(1turn) }
          }
        `}
      </style>
    </div>
  );
}


function BooksList() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const [searching, setSearching] = useState(false);
  const [booksList, setBooksList] = useState(books);
  const [statusMessage, setStatusMessage] = useState("");
  const [recentlyAddedBook, setRecentlyAddedBook] = useState(null);




  const goHome = () => {
    navigate("/");
  };
  const handleSearch = async () => {
  if (!searchTitle.trim() && !searchAuthor.trim()) return;

  setSearching(true);

  try {
    // 1️⃣ Search Gutenberg API
    const queryParts = [];
    if (searchTitle.trim()) queryParts.push(searchTitle.trim());
    if (searchAuthor.trim()) queryParts.push(searchAuthor.trim());

    const query = encodeURIComponent(queryParts.join(" "));
    const gutenbergRes = await axios.get(`https://gutendex.com/books?search=${query}`);
    const bookResult = gutenbergRes.data.results[0];
    console.log("Gutenberg search result:", bookResult);

    if (!bookResult) {
      console.log("No books found");
      setSearching(false);
      setStatusMessage("No books found with that title/author.");
      return;
    }

    const bookId = bookResult.id;

    // 2️⃣ Check if book already exists in backend
    const existing = await axios.get(`http://localhost:5000/api/books/${bookId}`).catch(() => null);

    if (existing && existing.data) {
      console.log("Book already exists in DB:", existing.data);
      setBooksList((prev) => [existing.data, ...prev]);
      setSearching(false);
      setStatusMessage("Book already exists in the list!");
      return;
    }

    // 3️⃣ Fetch book text from RapidAPI
    const rapidApiUrl = `https://project-gutenberg-free-books-api1.p.rapidapi.com/books/${bookId}/text`;
    const rapidApiRes = await axios.get(`http://localhost:5000/api/fetch_book_text/${bookId}`);
    const { title, content } = rapidApiRes.data;

    if (!content) {
      console.log("No text content found for this book.");
      setSearching(false);
      return;
    }



    if (!content) {
      console.log("No text content found for this book.");
      setSearching(false);
      return;
    }
  

const newBookRes = await axios.post("http://localhost:5000/api/books", {
  id: bookId,
  title,
  content
});


    const addedBook = newBookRes.data.book;
    setBooksList((prev) => [addedBook, ...prev]);
    setRecentlyAddedBook(addedBook); // show a copy under search bar
    setStatusMessage("Book found and added to the list!");

  } catch (err) {
    console.error("Error searching or adding book:", err);
  } finally {
    setSearching(false);
  }
};





  useEffect(() => {
  axios.get("http://localhost:5000/api/books")
    .then(res => {
      // Sort alphabetically by title
      const sortedBooks = res.data.sort((a, b) => a.title.localeCompare(b.title));
      setBooks(sortedBooks);
    })
    .catch(err => console.error("Error fetching books:", err));
}, []);


  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexDirection: "column" }}>
  <div style={{ display: "flex", gap: "10px" }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <label htmlFor="titleInput" style={{ marginBottom: "4px" }}>Title</label>
      <input
        id="titleInput"
        type="text"
        value={searchTitle}
        onChange={e => setSearchTitle(e.target.value)}
        placeholder="Search by title..."
        style={{ padding: "8px", flex: 1 }}
      />
    </div>

    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <label htmlFor="authorInput" style={{ marginBottom: "4px" }}>Author</label>
      <input
        id="authorInput"
        type="text"
        value={searchAuthor}
        onChange={e => setSearchAuthor(e.target.value)}
        placeholder="Search by author..."
        style={{ padding: "8px", flex: 1 }}
      />
    </div>

    <div style={{ display: "flex", alignItems: "flex-end" }}>
      <button onClick={handleSearch} disabled={searching} style={{ padding: "8px 16px" }}>
        {searching ? "Searching..." : "Search"}
      </button>
    </div>
  </div>
</div>


<div style={{ marginBottom: "20px" }}>
  {statusMessage && <p style={{ color: "#25b09b", fontWeight: "bold" }}>{statusMessage}</p>}

  {recentlyAddedBook && (
    <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
      <li key={recentlyAddedBook.id} style={{ marginBottom: "10px" }}>
        {recentlyAddedBook.title}
        <button 
          style={{ marginLeft: "10px" }} 
          onClick={() => navigate(`/read/${recentlyAddedBook.id}`)}
        >
          Start Reading
        </button>
      </li>
    </ul>
  )}
</div>



      <h1>Available Books</h1>
      <ul>
        {books.map(book => (
          <li key={book.id}>
            {book.title}
            <button 
              style={{ marginLeft: "10px" }} 
              onClick={() => navigate(`/read/${book.id}`)}
            >
              Start Reading
            </button>
          </li>
        ))}
      </ul>
      <div className="footer">
  <button onClick={goHome} style={{ marginLeft: "10px" }}>
    Go Home
  </button>
</div>
    </div>
  );
}

function ReadBook() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [page, setPage] = useState(0);  // current page index
  const [pages, setPages] = useState([]); // array of page chunks
  const CHARS_PER_PAGE = 1200; // adjust based on desired page size
  const [generatedImage, setGeneratedImage] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null); 
  const [selectedText, setSelectedText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(""); 
  const [readyToAnalyze, setReadyToAnalyze] = useState(false);
  const [loading, setLoading] = useState(false); // for feature calls
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [analyses, setAnalyses] = useState([]);
  const [chatMessages, setChatMessages] = useState([]); // {role: "user"/"assistant", content: "..."}
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState([]); // array of {title, artist, spotify_url}


  const handleSelection = () => {
  const selection = window.getSelection().toString();
  if (selection) setSelectedText(selection);
};

useEffect(() => {
  if (!book) return;
  axios.get(`http://localhost:5000/api/notes/${book.id}/${page}`)
    .then(res => setNotes(res.data))
    .catch(err => console.error("Error fetching notes:", err));
}, [book, page]);

useEffect(() => {
  if (!book) return;

  axios.get(`http://localhost:5000/api/analyses/${book.id}/${page}`)
    .then(res => setAnalyses(res.data))
    .catch(err => console.error("Error fetching analyses:", err));
}, [book, page]);

const handleAddNote = () => {
  if (!noteInput.trim()) return;
  
  axios.post("http://localhost:5000/api/notes", {
    book_id: book.id,
    page_number: page,
    content: noteInput
  })
  .then(res => {
    setNotes(prev => [...prev, res.data.note]);
    setNoteInput("");
  })
  .catch(err => console.error("Error adding note:", err));
};

const handleFeature = (feature, pageText, pageNum) => {
  
  switch (feature) {
    case "image":
      setLoading(true);
      axios.post("http://localhost:5000/api/render_text", {
        text: pageText,
        title: book.title,
        page_number: pageNum,
        book_id: book.id
      })
      .then(res => {
        
        if (res.data.image_base64) setGeneratedImage(res.data.image_base64);
      })
      .catch(err => console.error("Error generating image:", err))
      .finally(() => setLoading(false));
      break;

    case "sound":
      setLoading(true);
      axios.post("http://localhost:5000/api/render_sound", {
        text: pageText,
        title: book.title,
        page_number: pageNum,
        book_id: book.id
      })
      .then(res => {
        if (res.data.audio_base64) {
          // store it as a data URL
          setGeneratedAudio(`data:audio/wav;base64,${res.data.audio_base64}`);
        }
        setLoading(true);
        console.log("Sound generated", res.data);
      })
      .catch(err => console.error("Error generating sound:", err))
      .finally(() => setLoading(false));
      break;

    case "analysis":
      if (!selectedText) {
      
        return;
      }
      console.log("Sending text to analyze:", selectedText);
      setLoading(true);
      axios.post("http://localhost:5000/api/analyze_text", {
        text: selectedText,
        title: book.title,
        page_number: pageNum,
        book_id: book.id
      })
      .then(res => {

          const newAnalysis = res.data.analysis;
              
              // Save analysis in backend database
              axios.post("http://localhost:5000/api/analyses", {
                book_id: book.id,
                page_number: page,
                analysis: newAnalysis
              }).then(() => {
                // Refresh list of analyses
                return axios.get(`http://localhost:5000/api/analyses/${book.id}/${page}`);
              }).then(res => setAnalyses(res.data));

            })
            .catch(err => console.error("Error analyzing text:", err))
            .finally(() => {
              setLoading(false);
              setSelectedText(""); // optionally clear selection
            }); 
          break;


    case "notes":
      axios.post("http://localhost:5000/api/generate_notes", {
        text: pageText,
        title: book.title,
        page_number: pageNum,
        book_id: book.id
      })
      .then(res => console.log("Notes:", res.data))
      .catch(err => console.error("Error generating notes:", err));
      break;

  case "music":
    setLoading(true);
    setGeneratedImage(null);
    setGeneratedAudio(null);

    axios.post("http://localhost:5000/api/generate_music", {
      text: pageText,
      title: book.title,
      page_number: pageNum,
      book_id: book.id
    })
    .then(res => {
      if (res.data.songs) {
        setGeneratedMusic(res.data.songs);
      } else {
        setGeneratedMusic([]);
      }
    })
    .catch(err => console.error("Error generating music:", err))
    .finally(() => setLoading(false));
    break;


    default:
      console.warn("Unknown feature:", feature);
  }
};

const handleChatSubmit = () => {
  if (!chatInput.trim()) return;

  const userMessage = { role: "user", content: chatInput };
  setChatMessages(prev => [...prev, userMessage]);
  setChatInput("");
  setChatLoading(true);
  
  console.log(chatLoading);

  axios.post("http://localhost:5000/api/ask_gemini", {
    book_id: book.id,
    page_number: page,
    message: chatInput,
    text: pages[page],
    title: book.title
  })
  .then(res => {
    setChatLoading(true);
    const assistantMessage = { role: "assistant", content: res.data.reply };
    setChatMessages(prev => [...prev, assistantMessage]);
  })
  .catch(err => console.error("Error calling Gemini API:", err))
  .finally(() => setChatLoading(false));
};




useEffect(() => {
  axios.get(`http://localhost:5000/api/books/${id}`)
    .then(res => {
      setBook(res.data);

      const text = res.data.content;
      const chunks = [];

      let i = 0;
      while (i < text.length) {
        let end = i + CHARS_PER_PAGE;

        if (end < text.length) {
          let breakIndex = Math.max(
            text.lastIndexOf("\n\n", end),
            text.lastIndexOf(".", end),
            text.lastIndexOf("!", end),
            text.lastIndexOf("?", end)
          );
          if (breakIndex > i + CHARS_PER_PAGE * 0.7) {
            end = breakIndex + 1;
          }
        }

        chunks.push(text.slice(i, end).trim());
        i = end;
      }

      setPages(chunks);
      setPage(0);

    
    })
    .catch(err => console.error("Error fetching book:", err));
}, [id]);



  if (!book || pages.length === 0) return <p>Loading...</p>;

  const handleNext = () => {
    if (page < pages.length - 1) {
      const newPage = page + 1;
      setPage(newPage);
      handleFeature(activeFeature, pages[newPage], newPage);
      setSelectedText(""); // clear selected text
      setActiveFeature(null); // reset active feature on page change
      setGeneratedImage(null); // clear generated image
      setAnalysisResult(""); // clear analysis result
      setSelectedText(""); // clear selected text
    }
  };

  const handlePrev = () => {
    if (page > 0) {
      const newPage = page - 1;
      setPage(newPage);
      handleFeature(activeFeature, pages[newPage], newPage);
      setActiveFeature(null); // reset active feature on page change
      setGeneratedImage(null); // clear generated image
      setAnalysisResult(""); // clear analysis result
      setSelectedText(""); // clear selected text
    }
  };

  const chooseBook = () => {
    window.location.href = '/books';
  }


  const handlePrintAnnotations = async () => {
  if (!book || pages.length === 0) return;

  try {
    const res = await axios.get(`http://localhost:5000/api/annotations/${book.id}`);
    const { notes, analyses, images, audios, music } = res.data;

    let html = `<html><head>
      <title>${book.title} - Annotations</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        h2, h3 { color: #25b09b; }
        .page-section { margin-bottom: 40px; page-break-after: always; }
        .annotation { border: 1px solid #ccc; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
        img { max-width: 100%; margin-bottom: 10px; border-radius: 5px; }
        audio { width: 100%; margin-bottom: 10px; }
        pre { white-space: pre-wrap; line-height: 1.6; background: #f9f9f9; padding: 10px; border-radius: 5px; }
      </style>
    </head><body><h1>${book.title}</h1>`;

    pages.forEach((pageText, pageIndex) => {
      const pageNotes = notes.filter(n => n.page_number === pageIndex);
      const pageAnalyses = analyses.filter(a => a.page_number === pageIndex);
      const pageImages = images.filter(i => i.page_number === pageIndex);
      const pageAudios = audios.filter(a => a.page_number === pageIndex);
      const pageMusic = music.filter(m => m.page_number === pageIndex);

      html += `
        <div class="page-section">
          <h2>Page ${pageIndex + 1}</h2>
          <h3>Page Text</h3>
          <pre>${pageText}</pre>

          <h3>Notes</h3>
          ${pageNotes.length ? pageNotes.map(n => `<div class="annotation">${n.content}</div>`).join('') : "<p>No notes</p>"}

          <h3>Analyses</h3>
          ${pageAnalyses.length ? pageAnalyses.map(a => `<div class="annotation">${a.content}</div>`).join('') : "<p>No analyses</p>"}

          <h3>Images</h3>
          ${pageImages.length ? pageImages.map(img => `<img src="data:image/png;base64,${img.image_base64}" />`).join('') : "<p>No images</p>"}

          <h3>Music Recommendations</h3>
          ${pageMusic.length ? pageMusic.map(m => {
            const songs = JSON.parse(m.songs_json);
            return songs.map(song => `<div>${song.title} — ${song.artist} ${song.spotify_url ? `<a href="${song.spotify_url}" target="_blank">[Listen]</a>` : ''}</div>`).join('');
          }).join('') : "<p>No music</p>"}
        </div>
      `;
    });

    html += `</body></html>`;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

  } catch (err) {
    console.error("Error printing annotations:", err);
  }
};



 return (
  <div style={{ display: "flex", height: "100vh" }}>
  {/* Left side */}

  <div className='left-panel' style={{ display: "flex", flexDirection: "column", flex: 1, borderRight: "1px solid #ccc" }}>
    

  <div 
    style={{ flex: 1, padding: "20px", overflowY: "auto" }} 
    onMouseUp={handleSelection}
  >
    <div style={{ marginBottom: "10px" }}>
  <button
  onClick={() => window.open(`http://localhost:5000/api/annotations_pdf/${book.id}`, "_blank")}
  style={{ padding: "8px 16px", backgroundColor: "#25b09b", color: "white", border: "none", borderRadius: "5px" }}
>
  Print Annotations
</button>

</div>
    <h2>{book.title}</h2>
    <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
      <ReactMarkdown>{pages[page]}</ReactMarkdown>
    </p>
  </div>


    {/* Footer */}
    <div className = "footer">
      <button onClick={handlePrev} disabled={page === 0}>Previous</button>
      <span>Page {page + 1} of {pages.length}</span>
      <button onClick={handleNext} disabled={page === pages.length - 1}>Next</button>
    </div>
  </div>


      {/* Right side */}
      <div className = "right-panel" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Feature buttons */}
        <div className = "feature-buttons" style={{ display: "flex", justifyContent: "space-around", gap: "20px", padding: "10px", borderBottom: "1px solid #ccc" }}>
          {["image", "sound", "analysis", "notes", "music", "ask"].map(feature => (
          <button 
            key={feature} 
            onClick={() => {
              setActiveFeature(feature);
              if (feature === "analysis") {
                setReadyToAnalyze(true);  // show the “Generate Analysis” button
              } else {
                setReadyToAnalyze(false);
                handleFeature(feature, pages[page], page);  // immediately generate for other features
              }
            }}
          >
            {feature.charAt(0).toUpperCase() + feature.slice(1)}
          </button>
        ))}

        </div>

        {/* Feature content */}
        <div className = "feature-content" style={{ flex: 1, padding: "20px", overflowY: "auto", textAlign: "center" }}>
          {loading ? (
            <Loader />
          ) :
          
          activeFeature === "image" ? (
            generatedImage ? (
              <img 
                src={`data:image/png;base64,${generatedImage}`} 
                alt="Generated" 
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "8px" }}
              />
            ) : (
              <p style={{ color: "#888" }}>Image will appear here</p>
            )
          ) : 
          activeFeature === "sound" ? (
            generatedAudio ? (
              <audio controls style={{ width: "100%" }}>
                <source src={generatedAudio} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <p style={{ color: "#888" }}>Sound will appear here</p>
            ) ):
            activeFeature === "notes" ? (
              <div style={{ textAlign: "left" }}>
                <h3>Notes for this page:</h3>
                {notes.length === 0 ? (
                  <p style={{ color: "#888" }}>No notes yet. Add one below!</p>
                ) : (
                  <ul>
                    {notes.map(note => (
                      <li key={note.id} style={{ marginBottom: "10px", background: "#f9f9f9", padding: "10px", borderRadius: "5px" }}>
                        {note.content}
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ marginTop: "20px" }}>
                  <textarea 
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Add a new note..."
                    rows={3}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                  />
                  <button 
                    onClick={handleAddNote}
                    style={{ marginTop: "10px", padding: "10px 20px", borderRadius: "5px", border: "none", background: "#25b09b", color: "#fff", cursor: "pointer" }}
                  >
                    Add Note
                  </button>
                </div>
              </div>
            ) :
          
          activeFeature === "music" ? (
            generatedMusic && generatedMusic.length > 0 ? (
              <div style={{ textAlign: "left" }}>
                <h3>Recommended Songs for this Page:</h3>
                {generatedMusic.map((song, index) => (
                  <div key={index} style={{ marginBottom: "20px" }}>
                    <strong>{song.title}</strong> — {song.artist}
                    <SpotifyEmbed url={song.spotify_url} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#888" }}>No music yet — click again to generate recommendations.</p>
            )
          )


          : activeFeature === "analysis" ? (
            analysisResult ? (
              <AnalysisDisplay rawAnalysisResult={analysisResult} />
          
            )
            
            : (
              <div>
              <h3>Generated Analyses for this page:</h3>
              {analyses.length === 0 ? (
                <p style={{ color: "#888" }}>No analyses yet. Highlight text and generate one!</p>
              ) : (
                analyses.map(a => (
                  <div key={a.id} style={{ marginBottom: "20px", textAlign: "left", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
                    <small>{new Date(a.created_at).toLocaleString()}</small>
                    <AnalysisDisplay rawAnalysisResult={a.content} />
                  </div>
                ))
              )}

              <button 
                onClick={() => handleFeature("analysis", pages[page], page)} 
    
                style={{ marginTop: "10px" }}
              >
                Generate Analysis
              </button>
            </div>


            )
          ) : activeFeature === "ask" ? (
  <div style={{ textAlign: "left" }}>
    <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
      {chatMessages.length === 0 ? (
        <p style={{ color: "#888" }}>Your chat will show up here once you ask a question!</p>
      ) : (
        chatMessages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px", textAlign: msg.role === "user" ? "right" : "left" }}>
            <div style={{ display: "inline-block", background: msg.role === "user" ? "#148e7cff" : "#f1f1f1", color: msg.role === "user" ? "#fff" : "#000", padding: "8px 12px", borderRadius: "15px", maxWidth: "80%" }}>
              {msg.content}
            </div>
          </div>
        ))
      )}
    </div>
    <textarea
      value={chatInput}
      onChange={e => setChatInput(e.target.value)}
      rows={3}
      style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
      placeholder="Ask a question about this page..."
    />
    <button
      onClick={handleChatSubmit}
      style={{ marginTop: "10px", padding: "10px 20px", borderRadius: "5px", border: "none", background: "#25b09b", color: "#fff", cursor: "pointer" }}
      disabled={chatLoading || !chatInput.trim()}
    >
      {chatLoading ? "Thinking..." : "Send"}
    </button>
  </div>
          ): (
                      <p style={{ color: "#888" }}>Explore the features above to produce creative content.</p>
                    )}
        </div>


    {/* Footer */}
    <div className ="footer">
      <button onClick={chooseBook}>Choose another book</button>
    </div>
  </div>
</div>

);

}


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BooksList />} />
        <Route path="/read/:id" element={<ReadBook />} />
      </Routes>
    </Router>
  );
}

export default App;
