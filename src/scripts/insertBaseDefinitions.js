if (typeof(window.pendota) === "undefined") {
	window.pendota = {};
}

var pendota = window.pendota;

if (!pendota._pendotaIsInjected) {
	pendota._pendotaIsInjected = true;
	// Global listener functions so they can be removed easily
	pendota.blockerFunction = function(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	pendota.nonTABlockerFunction = function(e) {
		if (!pendota.someParentHasID(e.target, pendota.taggingAidId)) {
			pendota.blockerFunction(e);
		}
	}

	// Global status variables
	pendota.pendotaIsActive = false;
	pendota.sizzleIsActive = false;
	pendota.scannerIsActive = false;
	pendota.sentLastUpdate = false;

	// Locked elements
	pendota.scannerElementArray = [];
	pendota.sizzleSelector = "";
	pendota.lastSizzleHighlightId = 0; // ID used to connect match counts with the request triggered them

	// reused variables

	pendota.taggingAidId = "_pendota-tag-assistant_";
	pendota.lockedIconClass = "_pendota-icon-locked_";
	pendota.outlineBoxClass = "_pendota-outline_";
	pendota.exitImgContainerId = "_pendota_exit_img_container_";

	pendota.listenersToBlock = ["submit", "change", "input", "focus", "click"];

	pendota.blockMajorListeners = function() {
		pendota.listenersToBlock.forEach(function (ltype) {
			window.addEventListener(ltype, pendota.nonTABlockerFunction, true);
		});
	}

	pendota.unblockMajorListeners = function() {
		pendota.listenersToBlock.forEach(function (ltype) {
			window.removeEventListener(ltype, pendota.nonTABlockerFunction, true);
		});
	}

	pendota.sendMessageToAllFrames = function(tgt, msg) {
		if (tgt.parent === tgt) {
			pendota.sendMessageToChildFrames(tgt, msg);
		} else {
			pendota.sendMessageToAllFrames(tgt.parent, msg);
		}
	}

	pendota.sendMessageToChildFrames = function(tgt, msg) {
		if (typeof msg !== "string") msg = JSON.stringify(msg);
		tgt.postMessage(msg, "*");
		for (var i = 0; i < tgt.frames.length; i++) {
			pendota.sendMessageToChildFrames(tgt.frames[i], msg);
		}
	}

	pendota.tryParseJSON = function(msg) {
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

	pendota.mouseoverListener = function(e) {
		// Defines the actual mouseover function
		pendota.blockerFunction(e);

		// Don't process mouseover if over tagging aid
		if (
			!pendota.someParentHasID(e.target, pendota.taggingAidId) &&
			!!e.target.nodeName &&
			e.target.nodeName.toLowerCase() != "iframe"
		) {
			// Move the outline to the current item
			pendota.scannerElementArray = [];
			pendota.scannerElementArray[0] = e.target;
			pendota.updateOutline(e.target);

			// Send a signal to other frames
			pendota.sentLastUpdate = true; // protects the current from getting reset
			pendota.sendMessageToAllFrames(window, {
				type: "PENDOTA_UPDATE",
				element: pendota.passableObject(e.target),
			});
		}
	}

	pendota.scannerUpdateSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_UPDATE") {
				if (!pendota.sentLastUpdate) {
					// wipe out scanner tree if this frame did not send the most recent update
					$("._pendota-outline_").remove(); // Remove any active outline
					pendota.scannerElementArray = [];
				}
				pendota.sentLastUpdate = false; // set to false for all frames to wait for next signal
			}
		}
	}

	pendota.scannerTraverseUpSignalListener = function(e) {
		var currentElem = {};
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_TRAVERSE_UP") {
				if (pendota.scannerElementArray.length) {
					currentElem["obj"] =
						pendota.scannerElementArray[pendota.scannerElementArray.length - 1];
					if (currentElem["obj"].nodeName.toLowerCase() != "html") {
						parentElem = currentElem["obj"].parentNode;
						pendota.scannerElementArray.push(parentElem);
						pendota.updateOutline(parentElem);
					}
				}
			}
		}
	}

	pendota.scannerTraverseDownSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_TRAVERSE_DOWN") {
				if (pendota.scannerElementArray.length) {
					if (pendota.scannerElementArray.length > 1) {
						pendota.scannerElementArray.pop();
						childElem =
							pendota.scannerElementArray[pendota.scannerElementArray.length - 1];
						pendota.updateOutline(childElem);
					}
				}
			}
		}
	}

	// Define the basic mouseover functionality
	pendota.startMouseover = function() {
		pendota.scannerIsActive = true;
		window.removeEventListener("mouseover", pendota.blockerFunction, true);
		window.addEventListener("mouseover", pendota.mouseoverListener, true);
	}

	pendota.stopMouseover = function() {
		pendota.scannerIsActive = false;
		window.addEventListener("mouseover", pendota.blockerFunction, true);
		window.removeEventListener("mouseover", pendota.mouseoverListener, true);
	}

	pendota.passableObject = function(element) {
		if (!element) return null;
		else {
			var outElm = {};
			outElm.nodeName = element.nodeName;
			outElm.id = element.id;
			outElm.classes = pendota.jqClassToArr($(element).attr("class"));
			outElm.parentNode = pendota.passableObject(element.parentNode);
		}
		return outElm;
	}

	pendota.signalLockSwitch = function(e, isLocked) {
		e.preventDefault();
		if (
			pendota.someParentHasClass(e.target, pendota.lockedIconClass) ||
			!pendota.someParentHasID(e.target, pendota.taggingAidId)
		) {
			e.stopPropagation();
			message = { type: "LOCK_SWITCH" };
			if (typeof isLocked !== "undefined") message.isLocked = isLocked;
			pendota.sendMessageToAllFrames(window, message);
		}
	}

	pendota.scannerLockSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "LOCK_SWITCH") {
				pendota.scannerLockSwitch(data.isLocked);
			}
		}
	}

	pendota.scannerLockSwitch = function(isLocked) {
		if (typeof (isLocked !== "undefined")) {
			if (isLocked) pendota.stopMouseover();
			else pendota.startMouseover();
		} else {
			if (!pendota.scannerIsActive) pendota.startMouseover();
			else pendota.stopMouseover();
		}
	}

	// A click event will "lock" the fields in their current state.  Clicking again will re-enable. If the X button is clicked, this overrides the lock switch functionality.
	pendota.lockListener = function(e) {
		e.preventDefault();
		el = e.target;
		if (pendota.someParentHasID(el, pendota.exitImgContainerId)) {
			pendota._pendotaDeactivate_();
		} else if (pendota.someParentHasClass(el, pendota.lockedIconClass)) {
			pendota.signalLockSwitch(e, false);
		} else if (!pendota.someParentHasID(el, pendota.taggingAidId)) {
			pendota.signalLockSwitch(e, pendota.scannerIsActive);
		}
	}

	pendota.keyLockListener = function(e) {
		if (e.altKey && e.shiftKey && e.keyCode == 76) {
			// alt + shift + L to lock/unlock
			pendota.signalLockSwitch(e);
		}

		if (e.keyCode == 27) {
			// ESC to exit pendota UI
			pendota._pendotaDeactivate_();
		}
	}

	pendota.updateOutline = function(e) {
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

	var thUpdateOutline = _.throttle(pendota.updateOutline, 50);

	pendota.resetOutline = function() {
		if (pendota.scannerElementArray.length > 0)
			thUpdateOutline(pendota.scannerElementArray[pendota.scannerElementArray.length - 1]);
	}

	// Turns on sizzle highlighting function
	pendota._pendotaActivateHighlight = function(selector) {
		pendota.sizzleIsActive = true;
		pendota.sizzleSelector = selector;
		pendota._pendota_highlight();
		$(window).on("resize", pendota._pendota_highlight);
		$(window).on("scroll", pendota._pendota_highlight);
	}

	// Turns off sizzle highlighting
	pendota._pendotaDeactivateHighlight = function() {
		pendota.sizzleIsActive = false;
		$(window).off("resize", pendota._pendota_highlight);
		$(window).off("scroll", pendota._pendota_highlight);
		pendota._pendota_remove_highlight();
	}

	pendota.sizzleSwitchSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "SIZZLE_SWITCH") {
				if (!!data.isActive) {
					pendota._pendotaActivateHighlight(data.selector || "");
				} else {
					pendota._pendotaDeactivateHighlight();
				}
			}
		}
	}

	pendota.sizzleUpdateSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "SIZZLE_UPDATE") {
				pendota.sizzleSelector = data.selector || "";
				pendota.lastSizzleHighlightId = data.updateId;
				pendota._pendota_highlight();
			}
		}
	}

	// Function that adds the highlighting element to all matched elements if they are not part of the tagging aid
	pendota._pendota_highlight = function() {
		var selector = pendota.sizzleSelector;
		var updateId = pendota.lastSizzleHighlightId;
		pendota._pendota_remove_highlight();
		if (pendota.sizzleIsActive && selector > "") {
			try {
				var selectedElms = $(selector);
				var numMatch = 0;
				for (var i = 0; i < selectedElms.length; i++) {
					elm = selectedElms[i];;
					if (
						!pendota.someParentHasID(elm, pendota.taggingAidId) &&
						!pendota.someParentHasClass(elm, pendota.outlineBoxClass)
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
			if (pendota.lastSizzleHighlightId > 0) {
				pendota.sendMessageToAllFrames(window, {type:"SIZZLE_COUNT", updateId: updateId, count: numMatch});
				pendota.lastSizzleHighlightId = 0; // don't send duplicate counts on resize / scroll
			}
		}
	}

	pendota._pendota_remove_highlight = function() {
		$("._pendota-highlight-selector_").remove();
	}

	pendota.jqClassToArr = function(classes) {
		if (typeof classes != "undefined") {
			classes = classes.split(/\s+/); // should not split on just ' ' because classes can be separated by other forms of whitespace
		} else {
			classes = [""];
		}
		return classes;
	}

	// Function to check if specified ID is anywhere in the parent tree
	pendota.someParentHasID = function(element, idName) {
		if (!element) return null;
		else if (element.id != null && element.id == idName) return true;
		else
			return !element.parentNode
				? false
				: pendota.someParentHasID(element.parentNode, idName);
	}

	// Function to check if specified class is anywhere in the parent tree
	pendota.someParentHasClass = function(element, className) {
		if (!element) return null;
		else {
			var classes = pendota.jqClassToArr($(element).attr("class"));
			if (!!classes && classes.includes(className)) return true;
			else
				return !element.parentNode
					? false
					: pendota.someParentHasClass(element.parentNode, className);
		}
	}

	pendota.signalDeactivate = function() {
		pendota.sendMessageToAllFrames(window, { type: "PENDOTA_DEACTIVATE" });
	}

	pendota.signalDeactivateListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type === "PENDOTA_DEACTIVATE") {
				pendota._pendotaDeactivate_();
			}
		}
	}

	pendota._pendotaActivate_ = function() {
		if (!pendota.pendotaIsActive) {
			pendota.pendotaIsActive = true;
			pendota.startMouseover();
			if (typeof pendota._pendotaInsertUI_ !== "undefined") pendota._pendotaInsertUI_();

			// add listener for signal update events
			window.addEventListener("message", pendota.scannerUpdateSignalListener, true);

			// add listener for signal lock events
			window.addEventListener("message", pendota.scannerLockSignalListener, true);

			// add listener for signal traverse up events
			window.addEventListener(
				"message",
				pendota.scannerTraverseUpSignalListener,
				true
			);

			// add listener for signal traverse down events
			window.addEventListener(
				"message",
				pendota.scannerTraverseDownSignalListener,
				true
			);

			// add listener for click to lock events
			window.addEventListener("click", pendota.lockListener, true);

			// add listener for keyboard lock events
			window.addEventListener("keydown", pendota.keyLockListener);

			// on scroll or resize, adjust the outline box
			window.addEventListener("scroll", pendota.resetOutline);
			window.addEventListener("resize", pendota.resetOutline);
			
			// add listener for sizzler activation and updates
			window.addEventListener("message", pendota.sizzleSwitchSignalListener, true);
			window.addEventListener("message", pendota.sizzleUpdateSignalListener, true);

			// deactivate on signal from another frame
			window.addEventListener("message", pendota.signalDeactivateListener, false);

			pendota.blockMajorListeners();
		}
	}

	pendota._pendotaDeactivate_ = function() {
		if (pendota.pendotaIsActive) {
			pendota.pendotaIsActive = false;
			pendota.signalDeactivate();
			pendota.stopMouseover();
			$("." + pendota.outlineBoxClass).remove(); // Remove the outline
			$("._pendota-highlight-selector_").remove(); // Remove selector highlighter

			// Remove UI if present
			if (typeof pendota._pendotaRemoveUI_ !== "undefined") pendota._pendotaRemoveUI_();

			// Remove all assigned listeners
			window.removeEventListener(
				"message",
				pendota.scannerUpdateSignalListener,
				true
			);
			window.removeEventListener("message", pendota.scannerLockSignalListener, true);
			window.removeEventListener(
				"message",
				pendota.scannerTraverseUpSignalListener,
				true
			);
			window.removeEventListener(
				"message",
				pendota.scannerTraverseDownSignalListener,
				true
			);
			window.removeEventListener("click", pendota.lockListener, true);
			window.removeEventListener("mouseover", pendota.mouseoverListener, true);
			window.removeEventListener("mouseover", pendota.blockerFunction, true);
			window.removeEventListener("keydown", pendota.keyLockListener);
			window.removeEventListener("scroll", pendota.resetOutline);
			window.removeEventListener("resize", pendota.resetOutline);
			window.removeEventListener("message", pendota.sizzleSwitchSignalListener, true);
			window.removeEventListener("message", pendota.sizzleUpdateSignalListener, true);
			window.removeEventListener("message", pendota.signalDeactivateListener, false);
			pendota.unblockMajorListeners();
		}
	}
}

