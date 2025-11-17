// functions/summarize.ts
import { OpenAI } from "openai";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
export const handler = async (event, context) => {
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
        // Dynamic ESM import (required for youtube-transcript-api in Netlify)
        const { YouTubeTranscript } = await import("youtube-transcript-api");
        const transcriptParts = await YouTubeTranscript.fetchTranscript(videoId, {
            lang: "en"
        });
        const transcriptText = transcriptParts
            .map((part) => {
            return `[${Math.floor(part.start)}] ${part.text}`;
        })
            .join(" ");
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a YouTube video summarizer. Return a concise, bulleted summary with timestamps in the format [seconds]."
                },
                {
                    role: "user",
                    content: `Summarize this transcript:\n\n${transcriptText}`
                }
            ],
            temperature: 0.5,
            max_tokens: 250
        });
        const summary = chatCompletion.choices[0].message.content;
        return {
            statusCode: 200,
            body: JSON.stringify({ summary })
        };
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("No transcript found")) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "No transcript available for this video."
                })
            };
        }
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to generate summary."
            })
        };
    }
};
