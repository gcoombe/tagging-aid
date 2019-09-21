var isVisible = false;

chrome.browserAction.onClicked.addListener(function (tab) {
  
  if (!isVisible) {
    // for the current tab, inject the "inject.js" file & execute it
    chrome.tabs.executeScript(tab.id, {
      file: './src/scripts/jquery.min.js'
    });

    chrome.tabs.executeScript(tab.id, {
      file: './src/scripts/plain-draggable.min.js'
    }); 
    
    chrome.tabs.executeScript(tab.id, {
		  file: './src/scripts/insertUI.js'
    });

    isVisible = true;
  } else {
    chrome.tabs.executeScript(tab.id, {
		  file: './src/scripts/removeUI.js'
    });

    isVisible = false;
  }

});
