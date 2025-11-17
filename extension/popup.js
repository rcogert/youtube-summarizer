// popup.js

const videoInput = document.getElementById("videoInput");
const summarizeBtn = document.getElementById("summarizeBtn");
const copyBtn = document.getElementById("copyBtn");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");

// Try to read the current tab's YouTube URL and auto-fill
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
      const url = new URL(tab.url);
      const v = url.searchParams.get("v");
      if (v) {
        videoInput.value = tab.url; // keep full URL for user visibility
        setStatus("Detected YouTube video from current tab.");
      }
    }
  } catch (err) {
    console.error("Error getting active tab:", err);
  }
});

summarizeBtn.addEventListener("click", () => {
  const rawValue = videoInput.value.trim();
  if (!rawValue) {
    setStatus("Please enter a YouTube URL or video ID.");
    return;
  }

  const videoId = extractVideoId(rawValue);
  if (!videoId) {
    setStatus("Could not extract a video ID from that input.");
    return;
  }

  summarizeBtn.disabled = true;
  setStatus("Summarizing… this may take a few seconds.");
  outputEl.textContent = "";

  chrome.runtime.sendMessage(
    {
      type: "SUMMARIZE_VIDEO",
      videoId
    },
    (response) => {
      summarizeBtn.disabled = false;

      if (!response) {
        setStatus("No response from background script.");
        return;
      }

      if (response.error) {
        console.error(response.error);
        setStatus("Error: " + response.error);
        return;
      }

      if (response.summary) {
        outputEl.textContent = response.summary;
        setStatus("Done.");
      } else {
        setStatus("No summary returned.");
      }
    }
  );
});

copyBtn.addEventListener("click", async () => {
  const text = outputEl.textContent.trim();
  if (!text) {
    setStatus("Nothing to copy yet.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Summary copied to clipboard.");
  } catch (err) {
    console.error("Copy failed:", err);
    setStatus("Failed to copy to clipboard.");
  }
});

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function extractVideoId(input) {
  // If it's a full YouTube URL, parse it
  try {
    if (input.startsWith("http")) {
      const url = new URL(input);
      if (url.hostname.includes("youtube.com")) {
        return url.searchParams.get("v");
      }
      if (url.hostname === "youtu.be") {
        return url.pathname.replace("/", "");
      }
    }
  } catch {
    // probably not a URL; fall through
  }

  // If it looks like a bare video ID (11 chars, simple check)
  if (input.length === 11 && /^[a-zA-Z0-9_-]+$/.test(input)) {
    return input;
  }

  return null;
}
