import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function handler(event: any) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { videoId } = body;

    if (!videoId || typeof videoId !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid videoId" })
      };
    }

    // dynamic import so Netlify accepts YoutubeTranscript library
    const { YouTubeTranscript } = await import("youtube-transcript-api");

    const transcriptParts = await YouTubeTranscript.fetchTranscript(videoId, {
      lang: "en"
    });

    const transcriptText = transcriptParts
      .map((p: any) => `[${Math.floor(p.start)}] ${p.text}`)
      .join(" ");

    const result = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You summarize YouTube transcripts."
        },
        {
          role: "user",
          content: transcriptText
        }
      ]
    });

    const summary = result.choices[0].message.content;
    return { statusCode: 200, body: JSON.stringify({ summary }) };

  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
