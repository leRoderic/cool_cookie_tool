document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.cookies.getAll({url: tabs[0].url}, function(cookies) {
      const list = document.getElementById('cookie-list');
      list.innerHTML = '';
      cookies.forEach(function(cookie) {
        let listItem = document.createElement('li');
        listItem.textContent = `${cookie.name}: ${cookie.value}`;
        list.appendChild(listItem);
      });
    });
  });
});
