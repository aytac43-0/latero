document.getElementById("saveBtn").addEventListener("click", () => {
  const note = document.getElementById("noteInput").value;
  const reminder = document.getElementById("reminderInput").value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab || !tab.url) return;

    const url = encodeURIComponent(tab.url);
    const title = encodeURIComponent(tab.title || "");
    const encodedNote = encodeURIComponent(note || "");
    const encodedReminder = encodeURIComponent(reminder || "");

    // Using production URL or fallback
    const baseUrl = "https://latero-app.vercel.app";
    const lateroUrl = `${baseUrl}/add?url=${url}&title=${title}&note=${encodedNote}&reminder=${encodedReminder}`;

    chrome.tabs.create({ url: lateroUrl });
    window.close(); // Close popup after action
  });
});
