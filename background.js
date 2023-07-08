const updateInterval = 60 * 60 * 1000;
let config;

chrome.action.onClicked.addListener(() => {
    update();
});

chrome.runtime.onMessage.addListener(message => {
    if (message.target !== 'background') return false;

    switch (message.type) {
        case 'exchange-rate':
            chrome.storage.local.get(["lastExchangeRate"]).then(storage => {
                chrome.storage.local.set({ lastExchangeRate: message.data });
                if (!storage.lastExchangeRate) return;
                if (message.data > storage.lastExchangeRate) chrome.action.setBadgeBackgroundColor({ color: [0, 150, 0, 150] });
                else if (message.data < storage.lastExchangeRate) chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
            });
            chrome.action.setBadgeText({ text: `${message.data}` });
            chrome.action.setTitle({ title: `${message.data} RUB/${config.currencyName}` });
            break;
        default:
            console.warn(`Unexpected message type received: '${message.type}'.`);
            return false;
    }
});

chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("offscreen.html"),
    reasons: ['DOM_PARSER'],
    justification: 'Parse XML response'
});

function requestUpdate(callback) {
    fetch("https://www.cbr.ru/scripts/XML_daily.asp").then(r => r.text()).then(text => {
        chrome.runtime.sendMessage({
            type: 'parse-exchange-rate',
            target: 'offscreen',
            data: {
                code: config.currencyNumberCode,
                text: text
            }
        });
        if (callback) callback();
    });
}

function update() {
    let
        spinner = "◴◷◶◵",
        frame = 0,
        interval = setInterval(() => {
            chrome.action.setBadgeText({text: spinner[frame++ % spinner.length]});
            if (frame === 12) requestUpdate(() => clearInterval(interval));
        }, 50);
}

fetch(chrome.runtime.getURL("/config.json")).then(r => r.text()).then(text => {
    config = JSON.parse(text);
    setInterval(requestUpdate, updateInterval);
    update();
});
