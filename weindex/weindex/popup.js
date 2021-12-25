const bg = chrome.extension.getBackgroundPage();
let currentBlackList = bg.getBlackList();

const blackListDom = document.getElementById("blackList");

document.getElementById('confirm').addEventListener("click", () => {
    const text = document.getElementById('name').value;
    if (text) {
        bg.addBlackList(text);
        blackListDom.innerHTML = `<p>${JSON.stringify(currentBlackList)}</p>`;
    }
})

blackListDom.innerHTML = `<p>${JSON.stringify(currentBlackList)}</p>`;
