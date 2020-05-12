var _pendotaIsInjected = true;
// Global listener functions so they can be removed easily
function blockerFunction(e) {
	e.preventDefault();
	e.stopPropagation();
}

function nonTABlockerFunction(e) {
	if (!someParentHasID(e.target, taggingAidId)) {
		blockerFunction(e);
	}
}

// Global status variables
var pendotaIsActive = false;
var sizzleIsActive = false;
var scannerIsActive = false;
var sentLastUpdate = false;

// Locked elements
var scannerElementArray = [];
var sizzleSelector = "";
var lastSizzleId;

// reused variables

const taggingAidId = "_pendota-tag-assistant_";
const lockedIconClass = "_pendota-icon-locked_";
const outlineBoxClass = "_pendota-outline_";
const exitImgContainerId = "_pendota_exit_img_container_";
const copy_icon_url = chrome.extension.getURL("/src/ui/images/copy_icon.ico");
const pendo_target_url = chrome.extension.getURL(
	"/src/ui/images/pendo_target.png"
);

var listenersToBlock = ["submit", "change", "input", "focus", "click"];

function blockMajorListeners() {
	listenersToBlock.forEach(function (ltype) {
		window.addEventListener(ltype, nonTABlockerFunction, true);
	});
}

function unblockMajorListeners() {
	listenersToBlock.forEach(function (ltype) {
		window.removeEventListener(ltype, nonTABlockerFunction, true);
	});
}

function sendMessageToAllFrames(tgt, msg) {
	if (tgt.parent === tgt) {
		sendMessageToChildFrames(tgt, msg);
	} else {
		sendMessageToAllFrames(tgt.parent, msg);
	}
}

function sendMessageToChildFrames(tgt, msg) {
	if (typeof msg !== "string") msg = JSON.stringify(msg);
	tgt.postMessage(msg, "*");
	for (var i = 0; i < tgt.frames.length; i++) {
		sendMessageToChildFrames(tgt.frames[i], msg);
	}
}

function tryParseJSON(msg) {
	if (typeof msg === "string") {
		try {
            msgJSON = JSON.parse(msg);
		} catch(e) {
			return msg;
        }
        return msgJSON;
	} else {
        return msg;
    }
}

function mouseoverListener(e) {
	// Defines the actual mouseover function
	blockerFunction(e);

	// Don't process mouseover if over tagging aid
	if (
		!someParentHasID(e.target, taggingAidId) &&
		!!e.target.nodeName &&
		e.target.nodeName.toLowerCase() != "iframe"
	) {
		// Move the outline to the current item
		scannerElementArray = [];
		scannerElementArray[0] = e.target;
		updateOutline(e.target);

		// Send a signal to other frames
		sentLastUpdate = true; // protects the current from getting reset
		sendMessageToAllFrames(window, {
			type: "PENDOTA_UPDATE",
			element: passableObject(e.target),
		});
	}
}

function scannerUpdateSignalListener(e) {
	if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_UPDATE") {
			if (!sentLastUpdate) {
				// wipe out scanner tree if this frame did not send the most recent update
				$("._pendota-outline_").remove(); // Remove any active outline
				scannerElementArray = [];
			}
			sentLastUpdate = false; // set to false for all frames to wait for next signal
		}
	}
}

function scannerTraverseUpSignalListener(e) {
	var currentElem = {};
	if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_TRAVERSE_UP") {
			if (scannerElementArray.length) {
				currentElem["obj"] =
					scannerElementArray[scannerElementArray.length - 1];
				if (currentElem["obj"].nodeName.toLowerCase() != "html") {
					parentElem = currentElem["obj"].parentNode;
					scannerElementArray.push(parentElem);
					updateOutline(parentElem);
				}
			}
		}
	}
}

function scannerTraverseDownSignalListener(e) {
	if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_TRAVERSE_DOWN") {
			if (scannerElementArray.length) {
				if (scannerElementArray.length > 1) {
					scannerElementArray.pop();
					childElem =
						scannerElementArray[scannerElementArray.length - 1];
					updateOutline(childElem);
				}
			}
		}
	}
}

// Define the basic mouseover functionality
function startMouseover() {
	scannerIsActive = true;
	window.removeEventListener("mouseover", blockerFunction, true);
	window.addEventListener("mouseover", mouseoverListener, true);
}

function stopMouseover() {
	scannerIsActive = false;
	window.addEventListener("mouseover", blockerFunction, true);
	window.removeEventListener("mouseover", mouseoverListener, true);
}

function passableObject(element) {
	if (!element) return null;
	else {
		var outElm = {};
		outElm.nodeName = element.nodeName;
		outElm.id = element.id;
		outElm.classes = jqClassToArr($(element).attr("class"));
		outElm.parentNode = passableObject(element.parentNode);
	}
	return outElm;
}

function signalLockSwitch(e, isLocked) {
	e.preventDefault();
	if (
		someParentHasClass(e.target, lockedIconClass) ||
		!someParentHasID(e.target, taggingAidId)
	) {
		e.stopPropagation();
		message = { type: "LOCK_SWITCH" };
		if (typeof isLocked !== "undefined") message.isLocked = isLocked;
		sendMessageToAllFrames(window, message);
	}
}

function scannerLockSignalListener(e) {
	if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type == "LOCK_SWITCH") {
			scannerLockSwitch(data.isLocked);
		}
	}
}

function scannerLockSwitch(isLocked) {
	if (typeof (isLocked !== "undefined")) {
		if (isLocked) stopMouseover();
		else startMouseover();
	} else {
		if (!scannerIsActive) startMouseover();
		else stopMouseover();
	}
}

// A click event will "lock" the fields in their current state.  Clicking again will re-enable. If the X button is clicked, this overrides the lock switch functionality.
function lockListener(e) {
	e.preventDefault();
	el = e.target;
	if (someParentHasID(el, exitImgContainerId)) {
		_pendotaDeactivate_();
	} else if (someParentHasClass(el, lockedIconClass)) {
		signalLockSwitch(e, false);
	} else if (!someParentHasID(el, taggingAidId)) {
		signalLockSwitch(e, scannerIsActive);
	}
}

function keyLockListener(e) {
	if (e.altKey && e.shiftKey && e.keyCode == 76) {
		// alt + shift + L to lock/unlock
		signalLockSwitch(e);
	}

	if (e.keyCode == 27) {
		// ESC to exit pendota UI
		_pendotaDeactivate_();
	}
}

function updateOutline(e) {
	// Controls highlight box
	$("._pendota-outline_").remove();
	var styles = e.getBoundingClientRect();
	let div = document.createElement("div");
	div.className = "_pendota-outline_";
	div.style.position = "fixed";
	div.style.content = "";
	div.style.height = `${styles.height + "px"}`;
	div.style.width = `${styles.width + "px"}`;
	div.style.top = `${styles.top + "px"}`;
	div.style.right = `${styles.right + "px"}`;
	div.style.bottom = `${styles.bottom + "px"}`;
	div.style.left = `${styles.left + "px"}`;
	div.style.zIndex = "9999998";
	div.style.pointerEvents = "none";
	document.body.appendChild(div);
}

var thUpdateOutline = _.throttle(updateOutline, 50);

function resetOutline() {
	if (scannerElementArray.length > 0)
		thUpdateOutline(scannerElementArray[scannerElementArray.length - 1]);
}

// Turns on sizzle highlighting function
function _pendotaActivateHighlight(selector) {
    sizzleIsActive = true;
    sizzleSelector = selector;
	_pendota_highlight();
	$(window).on("resize", _pendota_highlight);
	$(window).on("scroll", _pendota_highlight);
}

// Turns off sizzle highlighting
function _pendotaDeactivateHighlight() {
	sizzleIsActive = false;
	$(window).off("resize", _pendota_highlight);
	$(window).off("scroll", _pendota_highlight);
	_pendota_remove_highlight();
}

function sizzleSwitchSignalListener(e) {
    if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type == "SIZZLE_SWITCH") {
            if (!!data.isActive) {
                _pendotaActivateHighlight(data.selector || "");
            } else {
                _pendotaDeactivateHighlight();
            }
        }
    }
}

function sizzleUpdateSignalListener(e) {
    if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type == "SIZZLE_UPDATE") {
            sizzleSelector = data.selector || "";
            lastSizzleId = data.updateId;
            _pendota_highlight();
        }
    }
}

// Swaps between activated and deactivated status for sizzle highlighting
function _pendotaToggleHighlight() {
	if (sizzleIsActive) _pendotaDeactivateHighlight();
	else _pendotaActivateHighlight();
}

// Function that adds the highlighting element to all matched elements if they are not part of the tagging aid
function _pendota_highlight() {
    selector = sizzleSelector;
    updateId = lastSizzleId;
	_pendota_remove_highlight();
	if (sizzleIsActive && selector > "") {
		try {
			const selectedElms = document.querySelectorAll(selector);
			var numMatch = 0;
			for (let elm of selectedElms) {
				if (
					!someParentHasID(elm, taggingAidId) &&
					!someParentHasClass(elm, outlineBoxClass)
				) {
					numMatch++;
					var styles = elm.getBoundingClientRect();
					let div = document.createElement("div");
					div.className = "_pendota-highlight-selector_";
					div.style.position = "fixed";
					div.style.content = "";
					div.style.height = `${styles.height + "px"}`;
					div.style.width = `${styles.width + "px"}`;
					div.style.top = `${styles.top + "px"}`;
					div.style.right = `${styles.right + "px"}`;
					div.style.bottom = `${styles.bottom + "px"}`;
					div.style.left = `${styles.left + "px"}`;
					div.style.background = "rgba(236,32,89,0.25)";
					div.style.outline = "2px double #000";
					div.style.zIndex = "9999998";
					div.style.pointerEvents = "none";
					document.body.appendChild(div);
				}
			}
		} catch (error) {
			numMatch = 0;
        }
        console.log("Sizzler count sent from: ", window.frameElement || document);
        console.log("Sent: ", {type:"SIZZLE_COUNT", updateId: updateId, count: numMatch});
		sendMessageToAllFrames(window, {type:"SIZZLE_COUNT", updateId: updateId, count: numMatch});
	}
}

function _pendota_remove_highlight() {
	$("._pendota-highlight-selector_").remove();
}

function jqClassToArr(classes) {
	if (typeof classes != "undefined") {
		classes = classes.split(/\s+/); // should not split on just ' ' because classes can be separated by other forms of whitespace
	} else {
		classes = [""];
	}
	return classes;
}

// Function to check if specified ID is anywhere in the parent tree
function someParentHasID(element, idName) {
	if (!element) return null;
	else if (element.id != null && element.id == idName) return true;
	else
		return !element.parentNode
			? false
			: someParentHasID(element.parentNode, idName);
}

// Function to check if specified class is anywhere in the parent tree
function someParentHasClass(element, className) {
	if (!element) return null;
	else {
		var classes = jqClassToArr($(element).attr("class"));
		if (!!classes && classes.includes(className)) return true;
		else
			return !element.parentNode
				? false
				: someParentHasClass(element.parentNode, className);
	}
}

function signalDeactivate() {
	sendMessageToAllFrames(window, { type: "PENDOTA_DEACTIVATE" });
}

function signalDeactivateListener(e) {
	if (typeof(e.data) !== "undefined") {
		var data = tryParseJSON(e.data);
		if (typeof(data.type) !== "undefined" && data.type === "PENDOTA_DEACTIVATE") {
			_pendotaDeactivate_();
		}
	}
}

function _pendotaActivate_() {
	if (!pendotaIsActive) {
		pendotaIsActive = true;
		startMouseover();
		if (typeof _pendotaInsertUI_ !== "undefined") _pendotaInsertUI_();

		// add listener for signal update events
		window.addEventListener("message", scannerUpdateSignalListener, true);

		// add listener for signal lock events
		window.addEventListener("message", scannerLockSignalListener, true);

		// add listener for signal traverse up events
		window.addEventListener(
			"message",
			scannerTraverseUpSignalListener,
			true
		);

		// add listener for signal traverse down events
		window.addEventListener(
			"message",
			scannerTraverseDownSignalListener,
			true
		);

		// add listener for click to lock events
		window.addEventListener("click", lockListener, true);

		// add listener for keyboard lock events
		window.addEventListener("keydown", keyLockListener);

		// on scroll or resize, adjust the outline box
		window.addEventListener("scroll", resetOutline);
        window.addEventListener("resize", resetOutline);
        
        // add listener for sizzler activation and updates
        window.addEventListener("message", sizzleSwitchSignalListener, true);
        window.addEventListener("message", sizzleUpdateSignalListener, true);

		// deactivate on signal from another frame
		window.addEventListener("message", signalDeactivateListener, false);

		blockMajorListeners();
	}
}

function _pendotaDeactivate_() {
	if (pendotaIsActive) {
		pendotaIsActive = false;
		signalDeactivate();
		stopMouseover();
		$("." + outlineBoxClass).remove(); // Remove the outline
		$("._pendota-highlight-selector_").remove(); // Remove selector highlighter

		// Remove UI if present
		if (typeof _pendotaRemoveUI_ !== "undefined") _pendotaRemoveUI_();

		// Remove all assigned listeners
		window.removeEventListener(
			"message",
			scannerUpdateSignalListener,
			true
		);
		window.removeEventListener("message", scannerLockSignalListener, true);
		window.removeEventListener(
			"message",
			scannerTraverseUpSignalListener,
			true
		);
		window.removeEventListener(
			"message",
			scannerTraverseDownSignalListener,
			true
		);
		window.removeEventListener("click", lockListener, true);
		window.removeEventListener("mouseover", mouseoverListener, true);
		window.removeEventListener("mouseover", blockerFunction, true);
		window.removeEventListener("keydown", keyLockListener);
		window.removeEventListener("scroll", resetOutline);
        window.removeEventListener("resize", resetOutline);
        window.removeEventListener("message", sizzleSwitchSignalListener, true);
        window.removeEventListener("message", sizzleUpdateSignalListener, true);
		window.removeEventListener("message", signalDeactivateListener, false);
		unblockMajorListeners();
	}
}
