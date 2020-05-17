// NOTE: this script depends on insertBaseDefinitions being executed first
if(!pendota._pendotaUIIsInjected) {
	pendota._pendotaUIIsInjected = true;

	// Stores an array of elements traversed by the parent arrows. Resets on every mouseover when in unlocked state
	pendota._pendota_elem_array_ = [];

	// Reused variables
	pendota.sizzlerInputId = "_pendota-sizzler_";
	pendota.sizzlerBtnId = "_pendota-sizzler-icon_";
	pendota.sizzlerCountId = "_pendota-sizzler-count_";
	pendota.copy_icon_url = chrome.extension.getURL("/src/ui/images/copy_icon.ico");
	pendota.pendo_target_url = chrome.extension.getURL(
		"/src/ui/images/pendo_target.png"
	);

	// Global status variables
	pendota._pendota_isVisible_ = false;
	pendota._pendota_isLocked_ = false;
	pendota.lastSizzleId;
	pendota.sizzleCount;

    /*
    * Listeners for a signal to enter locked/unlocked state
    * @param {message} e
    */
	pendota.lockSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "LOCK_SWITCH") {
				pendota.lockSwitch(data.isLocked);
			}
		}
	}


    /*
    * Listens for a signal to change the current locked element.
    * @param {message} e
    */
	pendota.updateSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "PENDOTA_UPDATE") {
				pendota.updatePendotaContents(data.element);

				// Reset parent traversal tree
				pendota._pendota_elem_array_ = [];
				pendota._pendota_elem_array_[0] = data.element;
			}
		}
	}

    /*
    * Changes the UI between locked and unlocked states. Locks if isLocked = true, otherwise unlocks.
    * @param {boolean} isLocked
    */
	pendota.lockSwitch = function(isLocked) {
		// locks or unlocks the pendota element scanner
		// var el = e.target;
		if (typeof isLocked !== "undefined") {
			if (isLocked) pendota.lockedState();
			else pendota.unlockedState();
		} else {
			if (!pendota._pendota_isLocked_) {
				// if not on pendota interface, locks the scanner
				pendota.lockedState();
			} else {
				pendota.unlockedState();
			}
		}
	}

    /*
    * Forces UI to locked state. Is idempotent.
    */
	pendota.lockedState = function() {
		// Locks the scanner and UI
		document.getElementById("_pendota_status_").textContent =
			"Element Locked.  Click anywhere to reset.";
		//stopMouseover();
		$("#_pendota-lock-icon_").html(
			'<i class="_pendota-feather-locked_" data-feather="lock"></i>'
		);
		$("#_pendota-lock-icon_").addClass("_pendota-icon-locked_");
		$("#_pendota-parent-up_").removeClass("_pendota-hide-arrow_");
		$("#_pendota-parent-down_").removeClass("_pendota-hide-arrow_");
		feather.replace();
		$("#_pendota-feather-up-arrow_").attr(
			"class",
			"_pendota-parent-arrow_ _pendota-active-arrow_"
		);
		$("#_pendota-feather-down-arrow_").attr(
			"class",
			"_pendota-parent-arrow_ _pendota-disabled-arrow_"
		);
		pendota._pendota_isLocked_ = true;
	}

    /*
    * Forces UI to unlocked state. Is idempotent.
    */
	pendota.unlockedState = function() {
		// if already locked, unlocks instead
		// Set the lock icon to starting "unlocked" state
		$("#_pendota-lock-icon_").html(
			'<i class="_pendota-feather-unlocked_" data-feather="unlock"></i>'
		);
		$("#_pendota-lock-icon_").removeClass("_pendota-icon-locked_");
		$("#_pendota-parent-up_").addClass("_pendota-hide-arrow_");
		$("#_pendota-parent-down_").addClass("_pendota-hide-arrow_");
		feather.replace();

		// Set a status text letting the user the targeting is ready
		document.getElementById("_pendota_status_").innerHTML =
			"Click anywhere to Inspect. (Alt + Shift + L)";
		//startMouseover();
		pendota._pendota_isLocked_ = false;
	}

    /*
    * Reusable function that copies the content of an element with ID matching inputId to the clipboard.
    * @param {element} inputId
    */
	pendota.copyToClipboard = function(inputId) {
		// Get the text field
		var copyText = document.getElementById(inputId);

		// Select the text field
		copyText.select();
		copyText.setSelectionRange(0, 99999); // For mobile devices

		// Copy the text field
		document.execCommand("copy");
	}

    /*
    * Finds all copy icons currently in the UI and applies the copy function targeted at the corresponding box. 
    */
	pendota.applyCopyFunction = function() {
		$("._pendota-copy-link_").on("click", function (e) {
			e.stopPropagation();
			e.preventDefault();
			pendota.copyToClipboard(e.currentTarget.id);
		});
	}

    /*
    * Updates the element, ID, and classes in the tagging aid UI.
    * @param {element} e
    */	
    pendota.updatePendotaContents = function(e) {
		// Get the target element's Id and Classes
		var _id_ = e.id;
		var _classNames_ = e.classes;

		var _elemType_ = e.nodeName.toLowerCase(); // stylistic choice

		var appendedHTML = ""; // clear extra class results

		// Set the result boxes that are always visible
		$("#_pendota_type-result_").val("" + _elemType_);
		$("#_pendota_id-result_").val("#" + _id_);
		$("#_pendota_class-result-0_").val("." + _classNames_[0]);
		$("#_pendota_template-table_").empty();

		// Build extra class spaces
		for (i = 1; i < _classNames_.length; i++) {
			appendedHTML =
				appendedHTML +
				"<tr>" +
				'<td width="90%" class="_pendota_input-row_"><input no-drag class="_pendota_form-control_ _pendota_class-result_" type="text" id="_pendota_class-result-' +
				i +
				'_" value=".' +
				_classNames_[i] +
				'" readonly></td>' +
				'<td width="2%" class="_pendota_input-row_">&nbsp;</td>' +
				'<td width="8%" class="_pendota_input-row_">' +
				'<div id="_pendota_class-result-' +
				i +
				'_" class="_pendota-copy-link_");\'>' +
				'<a href="#"><img class=_pendota-copy-icon_ src=' +
				pendota.copy_icon_url +
				' style="width:20px;"></a>' +
				"</div>" +
				"</td>" +
				"</tr>";
		}

		// Append extra class spaces
		if (_classNames_.length > 1) {
			$("#_pendota_template-table_").html(appendedHTML);
		}

		// Define the copy function for all copy icons
		pendota.applyCopyFunction();
	}

    /*
    * Sends a signal to activate the Sizzler on all frames and directly activates in the UI.
    */
	pendota._pendotaActivateSizzler = function() {
		pendota.sendMessageToAllFrames(window, { type: "SIZZLE_SWITCH", isActive: true});
		pendota.signalSizzlerUpdate();
		$("#" + pendota.sizzlerBtnId).addClass("_pendota-clicked");
		$("#" + pendota.sizzlerBtnId).html("Stop");
		document.getElementById(pendota.sizzlerInputId).addEventListener("input", pendota.signalSizzlerUpdate);
		document.getElementById(pendota.sizzlerBtnId).removeEventListener("click", pendota._pendotaActivateSizzler);
		document.getElementById(pendota.sizzlerBtnId).addEventListener("click", pendota._pendotaDeactivateSizzler);
		window.addEventListener("message", pendota.sizzlerCountSignalListener, true);
	}

    /*
    * Sends a signal to deactivate the Sizzler on all frames and removes it from the UI.
    */
	pendota._pendotaDeactivateSizzler = function() {
		pendota.sendMessageToAllFrames(window, { type: "SIZZLE_SWITCH", isActive: false });
		$("#" + pendota.sizzlerBtnId).removeClass("_pendota-clicked");
		$("#" + pendota.sizzlerBtnId).html("Test");
		$("#" + pendota.sizzlerCountId).html("--");
		document.getElementById(pendota.sizzlerInputId).removeEventListener("input", pendota.signalSizzlerUpdate);
		document.getElementById(pendota.sizzlerBtnId).removeEventListener("click", pendota._pendotaDeactivateSizzler);
		document.getElementById(pendota.sizzlerBtnId).addEventListener("click", pendota._pendotaActivateSizzler);
		window.removeEventListener("message", pendota.sizzlerCountSignalListener, true);
	}

    /*
    * Sends a message to all frames to change the current sizzler selector to the value in the UI.
    */
	pendota.signalSizzlerUpdate = function() {
		pendota.sizzleCount = 0;
		pendota.lastSizzleId = pendota.fiveDigitId();
		pendota.sendMessageToAllFrames(window, {type: "SIZZLE_UPDATE", selector: document.getElementById(pendota.sizzlerInputId).value, updateId: pendota.lastSizzleId});
	}

    /*
    * As count updates come in, builds a count of Sizzler matches in every frame.
    * @param {int} value
    */
	pendota.addToSizzleCount = function(value) {
		pendota.sizzleCount += value;
		document.getElementById(pendota.sizzlerCountId).innerHTML = "(" + pendota.sizzleCount + ")";
	}

    /*
    * Listens for incoming count report signals. Does not add them if they do not match the most recent Sizzler updateId.
    * @param {message} e
    */
	pendota.sizzlerCountSignalListener = function(e) {
		if (typeof(e.data) !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (typeof(data.type) !== "undefined" && data.type == "SIZZLE_COUNT" && data.updateId == pendota.lastSizzleId) {
				pendota.addToSizzleCount(parseInt(data.count));
			}
		}
	}

    /*
    * Randomizes a 5-digit ID for the sizzler update process.
    * @returns {int}	a random int, always 5 digits
    */
	pendota.fiveDigitId = function() {
		return Math.floor(Math.random() * 90000) + 10000;
	}

    /*
    * Displays the tagging aid UI and turns on relevant listeners.
    */
	pendota._pendotaInsertUI_ = function() {
		//Injects the tag assistant UI
		pendota._pendota_isVisible_ = true;
		pendota._pendota_isLocked_ = false;

		// add listener for lock signal
		window.addEventListener("message", pendota.lockSignalListener, true);

		// add listener for update signal
		window.addEventListener("message", pendota.updateSignalListener, true);

		// Append popup div to the body
		$.get(chrome.extension.getURL("src/ui/pendota.html"))
			.then((data) => {
				$("body").append(data);
			})
			.then(() => {
				// Execute functions after appending UI

				feather.replace(); // sets feather icons (e.g. lock icon)

				var position = { x: 0, y: 0 };
				// Implements the interact.js library to make the assistant draggable
				interact("._pendota-draggable_").draggable({
					ignoreFrom: "[no-drag]",
					listeners: {
						move(event) {
							position.x += event.dx;
							position.y += event.dy;

							event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
						},
					},
				});

				// Points the image source for static images stored with extension
				$("._pendota-copy-icon_").attr("src", pendota.copy_icon_url);
				$("#_pendota-target-img_").attr("src", pendota.pendo_target_url);

				// Sets the onclick function for the parent tree traversal upwards
				document
					.getElementById("_pendota-parent-up_")
					.addEventListener("click", function (ev) {
						currentElem =
							pendota._pendota_elem_array_[pendota._pendota_elem_array_.length - 1];
						if (currentElem.nodeName.toLowerCase() != "html") {
							pendota.sendMessageToAllFrames(window, {
								type: "PENDOTA_TRAVERSE_UP",
							});
							parentElem = {};
							parentElem = currentElem.parentNode; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form
							pendota._pendota_elem_array_.push(parentElem);
							pendota.updatePendotaContents(parentElem);
							//updateOutline(parentElem["obj"]);
							$("#_pendota-feather-down-arrow_").attr(
								"class",
								"_pendota-parent-arrow_ _pendota-active-arrow_"
							);
							if (parentElem.nodeName.toLowerCase() == "html") {
								$("#_pendota-feather-up-arrow_").attr(
									"class",
									"_pendota-parent-arrow_ _pendota-disabled-arrow_"
								);
							}
						}
					});

				// Sets the onclick funtion for the parent tree traversal downwards
				document
					.getElementById("_pendota-parent-down_")
					.addEventListener("click", function (ev) {
						currentElem =
							pendota._pendota_elem_array_[pendota._pendota_elem_array_.length - 1];
						if (pendota._pendota_elem_array_.length > 1) {
							pendota.sendMessageToAllFrames(window, {
								type: "PENDOTA_TRAVERSE_DOWN",
							});
							pendota._pendota_elem_array_.pop();
							childElem =
								pendota._pendota_elem_array_[
									pendota._pendota_elem_array_.length - 1
								];
							pendota.updatePendotaContents(childElem);
							//updateOutline(childElem["obj"]);
							$("#_pendota-feather-up-arrow_").attr(
								"class",
								"_pendota-parent-arrow_ _pendota-active-arrow_"
							);
							if (pendota._pendota_elem_array_.length == 1) {
								$("#_pendota-feather-down-arrow_").attr(
									"class",
									"_pendota-parent-arrow_ _pendota-disabled-arrow_"
								);
							}
						}
					});

				// prep the sizzler in an off state
				var sizzleIsActive = false;
				document.getElementById(pendota.sizzlerBtnId).addEventListener("click", pendota._pendotaActivateSizzler);

				// set the scanner in motion the first time the UI is displayed
				pendota.unlockedState();

				// Apply the copy function to all copy icons
				pendota.applyCopyFunction();

				// Call highlight toggler when clicking enter
				$("#_pendota-sizzler-form_").on("submit", function (e) {
					e.preventDefault();
					document.getElementById(pendota.sizzlerBtnId).click();
				});
			});
	}


    /*
    * Removes the tagging aid UI and listeners.
    */
	pendota._pendotaRemoveUI_ = function() {
		pendota._pendota_isVisible_ = false;

		$("#_pendota-wrapper_").remove(); // Remove all html

		// Remove listeners
		window.removeEventListener("message", pendota.lockSignalListener, true);
		window.removeEventListener("message", pendota.updateSignalListener, true);
	}
}