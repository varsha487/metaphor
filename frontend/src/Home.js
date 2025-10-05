import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/books");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(to bottom, #c9dcdaff, #1e8c7f)",
      color: "#fff",
      textAlign: "center",
      padding: "20px"
    }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "20px", fontWeight: "bold" }}>Metaphor</h1>
      <p style={{ fontSize: "1.5rem", maxWidth: "600px", marginBottom: "40px" }}>
        Explore classic literature in a new interactive way: read, analyze, generate images, and listen to the text come alive.
      </p>
      <button 
        onClick={handleStart} 
        style={{
          padding: "15px 40px",
          fontSize: "1.2rem",
          backgroundColor: "#fff",
          color: "#25b09b",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.3s ease",
          fontWeight: "bold"
        }}
          onMouseOver={e => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.backgroundColor = "#e6f2f1"; 
  }}
        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
      >
        Start
      </button>
    </div>
  );
}

export default Home;
