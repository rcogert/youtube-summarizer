import { OpenAI } from "openai";
import fetch from "node-fetch";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS, POST"
};

async function fetchTranscript(videoId: string) {
  const urls = [
    `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`
  ];

  for (const url of urls) {
    const response = await fetch(url);
    const xml = await response.text();

    if (!xml.includes("<text")) continue;

    const parts = [...xml.matchAll(/<text start="(.*?)" dur=".*?">(.*?)<\/text>/g)]
      .map((m) => {
        const start = parseFloat(m[1]);
        const decoded = decodeURIComponent(m[2].replace(/&amp;/g, "&"));
        return `[${Math.floor(start)}] ${decoded}`;
      });

    if (parts.length > 0) return parts.join(" ");
  }
  return null;
}

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  try {
    const { videoId } = JSON.parse(event.body || "{}");

    if (!videoId) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ error: "Missing videoId" })
      };
    }

    const transcript = await fetchTranscript(videoId);

    if (!transcript) {
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({
          summary: "This video does not have a transcript available."
        })
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Summarize this transcript with bullet points and timestamps."
        },
        { role: "user", content: transcript }
      ]
    });

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ summary: result.choices[0].message.content })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err.message })
    };
  }
};
