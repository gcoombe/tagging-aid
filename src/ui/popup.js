chrome.runtime.onMessage.addListener(
    // Display loading message until receive information about whether designer is open
    function(request, sender, sendResponse) {
    console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
    console.log('message: ', request);
    if (request.designerEnabled) {
        console.log(document.getElementById('pendota-popup-wrapper'));
        document.getElementById('pendota-popup-wrapper').innerHTML = 
        `Cannot activate tagging aid while the designer is open.`;
    } else {
        document.getElementById('pendota-popup-wrapper').innerHTML =
        `<button id="btnDesignerToggle" class="popup-button">Launch Pendo Designer</button>
        <button id="btnTaggingAidToggle" class="popup-button">Toggle Tagging Aid</button>`;
        document.getElementById('btnDesignerToggle').addEventListener('click', launchDesigner);
        document.getElementById('btnTaggingAidToggle').addEventListener('click', launchPendota);
    }
});

// Triggers script that sends message about whether designer is open
chrome.tabs.executeScript({
    file: "./src/scripts/preloadCheck.js",
})

function launchDesigner() {
    // launch the Pendo designer
    chrome.tabs.executeScript({
        file: "./src/scripts/launchDesigner.js",
    });

    // dismiss the extension popup
    window.close();
}

function launchPendota() {
    // load dependency libraries

    chrome.tabs.executeScript({
        file: "./src/scripts/jquery.min.js",
    });

    chrome.tabs.executeScript({
        file: "./src/scripts/interact.min.js",
    });

    chrome.tabs.executeScript({
        file: "./src/scripts/feather.min.js",
    });

    // toggle on/off the pendota UI
    chrome.tabs.executeScript({
        file: "./src/scripts/toggleUI.js",
    });

    // dismiss the extension popup
    window.close();
}