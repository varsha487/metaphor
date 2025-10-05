import React, { useEffect, useState } from "react";
import axios from "axios";

function SpotifyEmbed({ url }) {
  const [embedHtml, setEmbedHtml] = useState("");

  useEffect(() => {
    if (!url) return;

    axios
    .get(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
     //.get(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/31TXxq8gfgYyrYClnYY48m?si=fc2e50dbdb6b4f53e`)
      .then((res) => {
        setEmbedHtml(res.data.html);
      })
      .catch((err) => {
        console.error("Error fetching Spotify oEmbed:", err);
      });
  }, [url]);

  return (
    <div
      className="spotify-embed"
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  );
}

export default SpotifyEmbed;
