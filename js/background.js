/*
* This file is deprecated in favor of the popup launch method
*/

chrome.browserAction.onClicked.addListener(function(tab) {
    // for the current tab, inject the required libraries and turn on the tagging aid
    chrome.tabs.executeScript(tab.id, {
        file: './src/scripts/jquery.min.js'
    });

    chrome.tabs.executeScript(tab.id, {
        file: './src/scripts/interact.min.js'
    });

    chrome.tabs.executeScript(tab.id, {
        file: './src/scripts/feather.min.js'
    });

    chrome.tabs.executeScript(tab.id, {
        file: './src/scripts/toggleUI.js'
    });
});