import React from "react";
import './App.css';

// Function to clean JSON string from markdown ticks
function cleanJsonString(jsonString) {
  return jsonString
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/```$/, "");
}

// Component to render the analysis
export default function AnalysisDisplay({ rawAnalysisResult }) {
  let analysisObj = {};

  try {
    const cleanedString = cleanJsonString(rawAnalysisResult);
    analysisObj = JSON.parse(cleanedString);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
  }

  // Separate summary from other keys
  const { summary, ...rest } = analysisObj;

  return (
    <div style={{ textAlign: "left"}}>
      {Object.entries(rest).map(([key, value], index) => (
        <div key={index} style={{ marginBottom: "1em" }}>
          <strong>"{key}"</strong>
          <div style={{ marginLeft: "1em" }}>{value}</div>
        </div>
      ))}

      {summary && (
        <div style={{ marginTop: "2em", paddingTop: "1em", borderTop: "1px solid #ccc" }}>
          <strong>Summary:</strong>
          <div style={{ marginLeft: "1em" }}>{summary}</div>
        </div>
      )}
    </div>
  );
}
