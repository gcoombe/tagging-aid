/*
* The tab window object is not directly available to extensions, so executing on the 
* pendo object requires this odd bit of finagling
*/

_pendotaRemoveUI_();
var elt = document.createElement("script");
elt.innerHTML = "window.pendo.designerv2.launchInAppDesigner();";
document.head.appendChild(elt);