# Metaphor
   ![Metaphor Logo](frontend/public/favicon.ico)

## Inspiration
We both have always loved reading — from classic literature to modern poetry — but also shared one common frustration: sometimes it’s so hard to understand. We’d spend hours trying to decode metaphors, symbols, and old-fashioned language. Since we also both love coding, we decided to merge our passions — literature and AI — to make reading not only easier but truly enjoyable. That’s how Team Metaphor was born.
## What it does
Metaphor reimagines how students experience literature.
You can upload your notes, poems, or a book chapter, and our app instantly transforms it into something creative and easy to grasp:
- 🖼️ Illustrations that visualize scenes and emotions
- 📜 Retellings that simplify complex text into clear, modern storytelling
- 🎵 Song suggestions that match the vibe or mood of the passage
- 🤖 Smart AI assistant that answers your questions and explains difficult words, metaphors, or ideas
Learning becomes memorable, not miserable.
## How we built it
We used Flask as our backend framework and React for frontend. We integrated Google’s Gemini 2.5 Flash model to handle text understanding, creative generation, and TTS (text-to-speech). We used Gutenberg’s API for book text and Spotify API for song widgets.
Our app:
- Accepts book text searches
- Sends it to the Gemini API for analysis and response
- Generates creative outputs and smart explanations
- Uses Genius API to fetch real songs and artists matching the text’s vibe
## Challenges we ran into
The hardest part was implementing song suggestions.
We first tried integrating the Spotify oEmbed API to produce widgets of song recommendations, but were not able to generate URLs directly from Gemini. So then we used Spotify’s general API to search for the Spotify URL which we then passed to the oEmbed API to get our result.
Another challenge was handling audio generation and file conversion, as we had to convert PCM data to WAV and then encode it for browser playback.
We also experienced challenges with the Print Annotations functionality that allows users to see all the annotations they made across their work. We tried various methods and settled on using ReportLab, a python module. This allowed for cleanest formatting with fastest execution time.
## Accomplishments that we're proud of
- We successfully built a multi-feature AI web app that connects literature and creativity.
Integrated real-time AI explanations, audio narration, and song recommendations.
- Managed complex API communication and in-memory audio processing.
- Designed an aesthetic, fully working interface with animated backgrounds and interactive highlights. 
- Most importantly — we made reading feel alive.
## What we learned
We learned how to:
- Integrate multiple APIs into one seamless experience
- Work with Gemini’s multimodal features (text + audio)
- Handle API responses, JSON formatting, and web data cleaning
- Overcome authentication issues and adapt to alternative APIs
- Combine creativity and engineering to make education engaging
- Work with Gutenberg API for book content
## What's next for Metaphor
Next, we plan to add:
- 🧩 Deeper literary analysis (themes, tone, symbols, and motifs)
- 🗣️ Voice customization for narration - e.g., different voices for different characters
- 💬 Interactive visual storytelling — turning retellings into moving comic panels
- 🌍 Expansion to other subjects beyond literature
