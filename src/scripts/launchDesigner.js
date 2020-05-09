/*
* The tab window object is not directly available to extensions, so executing on the 
* pendo object requires this odd bit of finagling
*/

typeof _pendotaRemoveUI_ !== "undefined" && _pendotaRemoveUI_(); // conditional necessary in case designer is launched before tagging aid

var elt = document.createElement("script");
elt.innerHTML = "window.pendo.designerv2.launchInAppDesigner();";
document.head.appendChild(elt);