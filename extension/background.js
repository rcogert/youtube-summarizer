// background.js

// Your deployed Netlify site
const NETLIFY_BASE_URL = "https://brilliant-moonbeam-e70394.netlify.app";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SUMMARIZE_VIDEO") {
    const { videoId } = message;

    fetch(`${NETLIFY_BASE_URL}/.netlify/functions/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ videoId })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        sendResponse({
          summary: data.summary || "",
          raw: data
        });
      })
      .catch((err) => {
        console.error("Summarize error:", err);
        sendResponse({
          error: err.message || "Unknown error"
        });
      });

    // Tell Chrome we will respond asynchronously
    return true;
  }
});
