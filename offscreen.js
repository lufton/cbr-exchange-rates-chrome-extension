chrome.runtime.onMessage.addListener(message => {
    if (message.target !== 'offscreen') return false;

    switch (message.type) {
        case 'parse-exchange-rate':
            let
                doc = new DOMParser().parseFromString(message.data.text, "application/xml"),
                valute = doc.evaluate(`//Valute[NumCode[.=${message.data.code}]]`, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
                value = valute.querySelector("Value").textContent.replace(',', '.'),
                nominal = valute.querySelector("Nominal").textContent.replace(',', '.');
            chrome.runtime.sendMessage({
                type: 'exchange-rate',
                target: 'background',
                data: value / nominal
            });
            break;
        default:
            console.warn(`Unexpected message type received: '${message.type}'.`);
            return false;
    }
});
