if (typeof(window.pendota) === "undefined") {
    // checks if the window pendota object already exists.
    // all functions and global vars are stored under this object.
	window.pendota = {};
}

// Defines a global reference to the window.pendota object.
var pendota = window.pendota;

// Avoids injecting the global definitions/variables more than once.
if (!pendota._pendotaIsInjected) {
    pendota._pendotaIsInjected = true;
    
    /*
    * Simple function that blocks all following functions from executing on an event.
    * @param {event} e
    */
	pendota.blockerFunction = function(e) {
		e.preventDefault();
		e.stopPropagation();
	}

    /*
    * Calls the blocker function unless the elemnt activated was part of the tagging aid UI.
    * @param {event} e
    */    
	pendota.nonTABlockerFunction = function(e) {
		if (!pendota.someParentHasID(e.target, pendota.taggingAidId)) {
			pendota.blockerFunction(e);
		}
	}

	// Global status variables.
	pendota.pendotaIsActive = false;
	pendota.sizzleIsActive = false;
	pendota.scannerIsActive = false;
	pendota.sentLastUpdate = false;

	// Locked elements.
	pendota.scannerElementArray = [];
	pendota.sizzleSelector = "";
	pendota.lastSizzleHighlightId = 0; // ID used to connect match counts with the request triggered them

	// reused variables
	pendota.taggingAidId = "_pendota-tag-assistant_";
	pendota.pendotaWrapperClass = "_pendota-wrapper_";
	pendota.lockedIconClass = "_pendota-icon-locked_";
	pendota.outlineBoxClass = "_pendota-outline_";
	pendota.exitImgContainerId = "_pendota_exit_img_container_";

    // collection of listener types to block outside the tagging aid.
	pendota.listenersToBlock = ["submit", "change", "input", "focus", "click"];

    /*
    * Loops through the designated listeners to block and blocks them all if outside the tagging aid UI.
    */
	pendota.blockMajorListeners = function() {
		pendota.listenersToBlock.forEach(function (ltype) {
			window.addEventListener(ltype, pendota.nonTABlockerFunction, true);
		});
	}

    /*
    * Loops through the previously blocked listeners and removes the blocker function. 
    */
	pendota.unblockMajorListeners = function() {
		pendota.listenersToBlock.forEach(function (ltype) {
			window.removeEventListener(ltype, pendota.nonTABlockerFunction, true);
		});
	}

    /*
    * Checks if tgt is the ultimate parent window. 
    * If true, starts the recursive child message sending.
    * If false, recursively checks the parent. 
    * @param {object}    tgt
    * @param {string}    msg
    */
	pendota.sendMessageToAllFrames = function(tgt, msg) {
		if (tgt.parent === tgt) {
			pendota.sendMessageToChildFrames(tgt, msg);
		} else {
			pendota.sendMessageToAllFrames(tgt.parent, msg);
		}
	}

    /*
    * Recursively travels down to every child of tgt and delivers the message msg
    * @param {object}    tgt
    * @param {string}    msg
    */
	pendota.sendMessageToChildFrames = function(tgt, msg) {
		if (typeof msg !== "string") msg = JSON.stringify(msg);
		tgt.postMessage(msg, "*");
		for (var i = 0; i < tgt.frames.length; i++) {
			pendota.sendMessageToChildFrames(tgt.frames[i], msg);
		}
	}

    /*
    * If given a string, tries to parse it to a JSON. If it fails, returns the original string.
    * @param    {string}             msg
    * @returns  {(object|string)}    the converted object, or the original string.
    */
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

    /*
    * On mouseover of any new element, does the following:
    * - creates an outline box on that element
    * - sends a signal to remove any other outline boxes in any frame 
    * - sends a signal to update the UI for a new hovered element
    * @param {event} e
    */
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

    /*
    * Checks if window message is an update to the current highlighted element.
    * If true, removes the current tracked element and highlight box in the frame.
    * @param {message} e
    */
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

    /*
    * Checks if window message is a signal to move up the parent tree. If true, updates the highlight box and the UI (if present).
    * @param {message} e
    */
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

    /*
    * Checks if window message is a signal to move down the parent tree. If true, updates the highlight box and the UI (if present).
    * @param {message} e
    */
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

    /*
    * Applies the correct listeners to activate the mouseover scanning behavior.
    */
	pendota.startMouseover = function() {
		pendota.scannerIsActive = true;
		window.removeEventListener("mouseover", pendota.blockerFunction, true);
		window.addEventListener("mouseover", pendota.mouseoverListener, true);
	}

    /*
    * Removes the mouseover scanning listener and applies a blocker function to avoid undesired dom changes.
    */
	pendota.stopMouseover = function() {
		pendota.scannerIsActive = false;
		window.addEventListener("mouseover", pendota.blockerFunction, true);
		window.removeEventListener("mouseover", pendota.mouseoverListener, true);
	}

    /*
    * Converts a dom object and its parent tree into a message-passable object, recursively.
    * @param    {object}    element
    * @returns  {object}    the converted element, stripped to only its element type, ID, classes, and array of parents (also converted).
    */
	pendota.passableObject = function(element) {
		if (!element) return null;
		else {
			var outElm = {};
			outElm.nodeName = element.nodeName;
			outElm.id = element.id;
			outElm.classes = pendota.jqClassToArr($(element).attr("class"));
			attrs = element.attributes;
			outElm.attributes = [];
			if (!!attrs) {
				for (var i = 0; i < attrs.length; i++) {
					if (!["class", "id", "style"].includes(attrs[i].nodeName)) {
						outElm.attributes.push({"attribute": attrs[i].nodeName, "value": attrs[i].value})
					}
				}
			}
			var tmpSpan = document.createElement('span');
			// passing to innerText then textContent strips out extra white space and text nodes like <br>
			// this is not quite 1:1 with Pendo, which does something to get only a single child node's text content,
			// but doesn't consider text nodes like <h1> or <span>. Room for improvement here.
			if(!!element.innerText) {
				tmpSpan.innerText = element.innerText;
				outElm.textContent = tmpSpan.textContent;
			} else {
				outElm.textContent = "";
			}
			outElm.parentNode = pendota.passableObject(element.parentNode);
			 if (!!outElm.parentNode) {
				delete outElm.parentNode.textContent;
			} 
		}
		return outElm;
	}

    /*
    * Fires a message to all frames to enter a locked/unlocked state. isLocked = true results in a locked state.
    * @param {message}    e
    * @param {boolean}  isLocked
    */
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

    /*
    * Listens for the lock signal message and fires the locking function when received.
    * @param {message}  e
    */
	pendota.scannerLockSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "LOCK_SWITCH") {
				pendota.scannerLockSwitch(data.isLocked);
			}
		}
	}

    /*
    * If isLocked is true, enters a locked state. Otherwise, enters unlocked state. Does not switch UI.
    * @param {boolean} isLocked
    */
	pendota.scannerLockSwitch = function(isLocked) {
		if (typeof (isLocked !== "undefined")) {
			if (isLocked) pendota.stopMouseover();
			else pendota.startMouseover();
		} else {
			if (!pendota.scannerIsActive) pendota.startMouseover();
			else pendota.stopMouseover();
		}
	}

    /*
    * Checks every click event in the bubble phase for whether it should activate a lock switch or deactivate the tagging aid.
    * @param {event} e
    */
	pendota.lockListener = function(e) {
		e.preventDefault();
		el = e.target;
		if (pendota.someParentHasID(el, pendota.exitImgContainerId)) {
			pendota.signalDeactivate();
		} else if (pendota.someParentHasClass(el, pendota.lockedIconClass)) {
			pendota.signalLockSwitch(e, false);
		} else if (!pendota.someParentHasID(el, pendota.taggingAidId)) {
			pendota.signalLockSwitch(e, pendota.scannerIsActive);
		}
	}

    /*
    * Checks every click event for the ESC key or the lock shortcut (Alt + Shift + L).
    * @param {event} e
    */
	pendota.keyLockListener = function(e) {
		if (e.altKey && e.shiftKey && e.keyCode == 76) {
			// alt + shift + L to lock/unlock
			pendota.signalLockSwitch(e);
		}

		if (e.keyCode == 27) {
			// ESC to exit pendota UI
			pendota.signalDeactivate();
		}
	}

    /*
    * Creates a floating unclickable div to highlight the element passed in.
    * @param {element} e
    */
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

    /*
    * Uses lodash to create a throttled version of the updateOutline function.
    * Was used on scrolls and resizes but the choppiness didn't look good. Performance has not been a major issue without it.
    * @param {element} e
    */
	pendota.thUpdateOutline = _.throttle(pendota.updateOutline, 25);

    /*
    * Retrieves the last known outlined object and redraws the highlight box using the throttled function.
    * For use on scroll or resize events.
    */
	pendota.resetOutline = function() {
		if (pendota.scannerElementArray.length > 0)
			pendota.updateOutline(pendota.scannerElementArray[pendota.scannerElementArray.length - 1]);
	}

    /*
    * Turns on Sizzle highlighting behavior for the current frame. Sets the first Sizzle selector value.
    */
	pendota._pendotaActivateHighlight = function() {
		pendota.sizzleIsActive = true;
		window.addEventListener("resize", pendota._pendota_highlight, true);
		window.addEventListener("scroll", pendota._pendota_highlight, true);
	}

    /*
    * Turns off Sizzle highlighting behavior for the current frame.
    */
	pendota._pendotaDeactivateHighlight = function() {
		pendota.sizzleIsActive = false;
		window.removeEventListener("resize", pendota._pendota_highlight, true);
		window.removeEventListener("scroll", pendota._pendota_highlight, true);
		pendota._pendota_remove_highlight();
	}

    /*
    * Listens for window messages indicating sizzle should change states to on/off. If isActive is true, sets to on, otherwise off.
    * @param {message} e
    */
	pendota.sizzleSwitchSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "SIZZLE_SWITCH") {
				if (!!data.isActive) {
					pendota._pendotaActivateHighlight();
				} else {
					pendota._pendotaDeactivateHighlight();
				}
			}
		}
    }
    
    /*
    * Listens for window messages with a change in Sizzle selector.
    * @param {message} e
    */
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

    /*
    * Checks the currently stored selector and updates Sizzle highlighting to match.
    * @param {
    */
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
						!pendota.someParentHasClass(elm, pendota.pendotaWrapperClass) &&
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

    /*
    * Removes any active sizzle boxes.
    */
	pendota._pendota_remove_highlight = function() {
		$("._pendota-highlight-selector_").remove();
	}

    /*
    * Converts the jQuery classes attribute to a list of separated strings in an array.
    * @param    {object}    classes
    * @returns  {array}     array of classname strings
    */
	pendota.jqClassToArr = function(classes) {
		if (typeof classes != "undefined") {
			classes = classes.split(/\s+/); // should not split on just ' ' because classes can be separated by other forms of whitespace
		} else {
			classes = [""];
		}
		return classes;
	}


    /*
    * Travels recursively up the parent tree looking for any element with id = idName.
    * @param    {object}    element
    * @param    {string}    idName
    * @returns  {boolean}   True if the element or any of its parents have id = idName. Otherwise false.
    */
	pendota.someParentHasID = function(element, idName) {
		if (!element) return null;
		else if (element.id != null && element.id == idName) return true;
		else
			return !element.parentNode
				? false
				: pendota.someParentHasID(element.parentNode, idName);
	}


    /*
    * Travels recursively up the parent tree looking for any element with a class matching className.
    * @param    {object}    element
    * @param    {string}    className
    * @returns  {boolean}   True if the element or any of its parents have a class matching className. Otherwise false.
    */
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

    /*
    * Sends a signal to all frames that the tagging aid and its UI should be removed.
    */
	pendota.signalDeactivate = function() {
		pendota.sendMessageToAllFrames(window, { type: "PENDOTA_DEACTIVATE" });
	}

    /*
    * Listens for a signal to shut down all aspects of the tagging aid, including the UI.
    * @param {message} e
    */
	pendota.signalDeactivateListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type === "PENDOTA_DEACTIVATE") {
				pendota._pendotaDeactivate_();
			}
		}
	}

    /*
    * Displays the tagging aid and (if loaded) the UI.
    */
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

    /*
    * Removes the tagging aid and (if loaded) the UI.
    */
	pendota._pendotaDeactivate_ = function() {
		if (pendota.pendotaIsActive) {
			pendota.pendotaIsActive = false;
			pendota.stopMouseover();
			$("." + pendota.outlineBoxClass).remove(); // Remove the outline
			pendota._pendotaDeactivateHighlight() // Remove the sizzler if active

			// Remove UI if present
			if (typeof pendota._pendotaRemoveUI_ !== "undefined") pendota._pendotaRemoveUI_();

			// Remove all listeners assigned in _pendotaActivate_
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

