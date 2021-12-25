let blackList = [...initBlackList];

function addBlackList(text) {
    if (!blackList.includes(text)) {
        blackList.push(text);
    }
}

function getBlackList() {
    return blackList;
}

chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        if (request.action === "getBlackList")
            sendResponse({blackList: getBlackList()});
        else
            sendResponse({}); // snub them.
    });