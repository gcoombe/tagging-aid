chrome.browserAction.onClicked.addListener(function (tab) {
  // for the current tab, inject the "inject.js" file & execute it

    chrome.tabs.executeScript(tab.ib, {
    file: './src/scripts/jquery.min.js'
    });
    
    chrome.tabs.executeScript(tab.ib, {
		file: './src/scripts/insertUI.js'
    });

});
