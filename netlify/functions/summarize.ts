import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler = async (event: any) => {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: "Method Not Allowed"
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { videoId } = body;

    if (!videoId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: "Missing videoId"
      };
    }

    // Dynamic import for ESM
    const { YouTubeTranscript } = await import("youtube-transcript-api");

    const transcriptParts = await YouTubeTranscript.fetchTranscript(videoId, {
      lang: "en"
    });

    const transcriptText = transcriptParts
      .map((p: any) => `[${Math.floor(p.start)}] ${p.text}`)
      .join(" ");

    const chat = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
You are a YouTube Creator Assistant. Your job is to turn raw video transcripts into structured, high-value creator notes.

Given a transcript with timestamps, produce:

1. **Core Summary (2–3 sentences)**

2. **Timestamped Chapters**
   - Clear, compelling chapter titles.
   - Accurate timestamps.

3. **Key Insights (bullets)**

4. **Hook Ideas (5–10 short hooks)**

5. **Notable Quotes or Moments (with timestamps)**

6. **SEO Keywords (10–20 keywords)**

Do not mention that you are an AI. Output only the structured summary.
`
        },
        {
          role: "user",
          content: transcriptText
        }
      ]
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        summary: chat.choices[0].message.content
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        error: err.message || "Unknown error"
      })
    };
  }
};
