/*
* The tab window object is not directly available to extensions, so executing on the 
* pendo object requires this odd bit of finagling
*/

var elt = document.createElement("script");
elt.innerHTML = "window.postMessage({ type: 'PRELOAD_CHECK', designerEnabled: (!window.pendo ? false : (!!window.pendo.designerEnabled || !!window.pendo.designerLaunched)), pendoExists: !!window.pendo }, '*');";
document.head.appendChild(elt);

if (!window.sendMsgToExt) { // only add the listener once
    window.sendMsgToExt = function(event) {
        // We only accept messages from ourselves
        if (event.source != window)
          return;
      
        if (event.data.type && (event.data.type == "PRELOAD_CHECK") && (event.data.hasOwnProperty('designerEnabled'))) {
            chrome.runtime.sendMessage({designerEnabled: event.data.designerEnabled, pendoExists: event.data.pendoExists}); // pass to the extension popup
        }
    }
    
    window.addEventListener("message", window.sendMsgToExt);
}
