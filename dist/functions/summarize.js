"use strict";
// netlify/functions/summarize.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const youtube_transcript_api_1 = require("youtube-transcript-api");
const openai_1 = require("openai");
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const body = JSON.parse(event.body || '{}');
        const { videoId } = body;
        if (!videoId || typeof videoId !== 'string') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid videoId' }) };
        }
        const transcriptParts = await (0, youtube_transcript_api_1.getTranscript)(videoId, { lang: 'en' });
        const transcriptText = transcriptParts
            .map((part) => `[${Math.floor(part.start)}] ${part.text}`)
            .join(' ');
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a YouTube video summarizer...` // Content omitted for brevity
                },
                {
                    role: 'user',
                    content: `Please summarize this transcript:\n\n${transcriptText}`
                }
            ],
        });
        const summary = chatCompletion.choices[0].message.content;
        return { statusCode: 200, body: JSON.stringify({ summary }) };
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('No transcript found')) {
            return { statusCode: 404, body: JSON.stringify({ error: 'No transcript available for this video.' }) };
        }
        console.error('Error processing request:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate summary.' }) };
    }
};
exports.handler = handler;
