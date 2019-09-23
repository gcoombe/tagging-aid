var visibleDictionary = { };

chrome.browserAction.onClicked.addListener(function (tab) {
  if (typeof(visibleDictionary[tab.id]) == "undefined") {
    visibleDictionary[tab.id] = false;
  }
  isVisible = visibleDictionary[tab.id];
  if (!isVisible) {
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
      file: './src/scripts/jqueryhotkeys.js'
    }); 
    
    chrome.tabs.executeScript(tab.id, {
		  file: './src/scripts/insertUI.js'
    });

    visibleDictionary[tab.id] = true;
  } else {
    chrome.tabs.executeScript(tab.id, {
		  file: './src/scripts/removeUI.js'
    });

    visibleDictionary[tab.id] = false;
  }

});
