chrome.browserAction.onClicked.addListener(function (tab) {
    // for the current tab, inject the "inject.js" file & execute it
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
