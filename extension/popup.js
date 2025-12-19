document.getElementById("saveBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab || !tab.url) return;

    const url = encodeURIComponent(tab.url);
    const title = encodeURIComponent(tab.title || "");

    const lateroUrl = `https://latero-app.vercel.app/add?url=${url}&title=${title}`;

    chrome.tabs.create({ url: lateroUrl });
  });
});
