chrome.action.onClicked.addListener((tab) => {
    if (!tab.url) return;

    const appUrl = 'https://latero-app.vercel.app/add';
    const targetUrl = `${appUrl}?url=${encodeURIComponent(tab.url)}&title=${encodeURIComponent(tab.title || '')}`;

    chrome.tabs.create({ url: targetUrl });
});
