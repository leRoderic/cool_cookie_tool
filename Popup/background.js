chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getCookies
  });
});

function getCookies() {
  chrome.cookies.getAll({ url: window.location.href }, function(cookies) {
    for (let cookie of cookies) {
      console.log(cookie);
    }
  });
}
