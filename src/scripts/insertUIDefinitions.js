// NOTE: this script depends on insertBaseDefinitions being executed first
if (!pendota._pendotaUIIsInjected) {
	pendota._pendotaUIIsInjected = true;

	// Stores an array of elements traversed by the parent arrows. Resets on every mouseover when in unlocked state
	pendota._pendota_elem_array_ = [];

	// Reused variables
	pendota.wrapperClass = "_pendota-wrapper_";
	pendota.hiddenClass = "_pendota-hidden_";
	pendota.ddShowClass = "_pendota-dropdown-show_";
	pendota.statusMessageId = "_pendota_lock-message_";
	pendota.sizzlerInputFormId = "_pendota-sizzler-form_";
	pendota.sizzlerInputId = "_pendota-sizzler_";
	pendota.sizzlerBtnId = "_pendota-sizzler-btn_";
	pendota.sizzlerIconId = "_pendota-sizzler-icon_";
	pendota.sizzlerCountId = "_pendota-sizzler-count_";
	pendota.tagBuilderCopyBtnId = "_pendota-tag-builder-copy-btn_";
	pendota.tagBuilderCopyIconId = "_pendota-tag-builder-copy-icon_";
	pendota.tagBuilderFreetextBtnId = "_pendota-free-text-btn_";
	pendota.tagBuilderFreetextIconId = "_pendota-free-text-icon_";
	pendota.copyBtnClass = "_pendota-copy-btn_";
	pendota.autoTagsId = "_pendota-auto-tags_";
	pendota.tagBuilderId = "_pendota-tag-builder_";
	pendota.tagBuilderNonFreetextId = "_pendota-tag-builder-non-freetext_";
	pendota.tagBuilderPlaceholderId = "_pendota-tag-builder-placeholder_";
	pendota.tagBuilderClearBtnId = "_pendota-tag-builder-clear-btn_";
	pendota.tagElmClass = "_pendota-tag-elm_";
	pendota.tagItemClass = "_pendota-tag-item_";
	pendota.activeTagItemClass = "_pendota-active-tag-elm_";
	pendota.tagItemTextClass = "_pendota-tag-item-text_";
	pendota.tagItemDdClass = "_pendota-tag-item-dropdown_";
	pendota.tagItemDdItemClass = "_pendota-tag-item-dd-item_";
	pendota.tagItemDdInpDivClass = "_pendota-tag-item-dd-inp-div_";
	pendota.tagItemDdInpClass = "_pendota-tag-item-dd-inp_";
	pendota.tagItemDdInpSubmitClass = "_pendota-tag-item-dd-inp-submit_";
	pendota.copyBtnClass = "_pendota-copy-btn_";
	pendota.addToBuildBtnClass = "_pendota-addtobuild-btn_";
	pendota.uiTypeBlockId = "_pendota-type-block_";
	pendota.uiTypeTableId = "_pendota_type-table_";
	pendota.uiIdBlockId = "_pendota-id-block_";
	pendota.uiIdTableId = "_pendota_id-table_";
	pendota.uiClassBlockId = "_pendota-class-block_";
	pendota.uiClassTableId = "_pendota_class-table_";
	pendota.uiAttrBlockId = "_pendota-attr-block_";
	pendota.uiAttrTableId = "_pendota_attr-table_";
	pendota.uiTextBlockId = "_pendota-text-block_";
	pendota.uiTextTableId = "_pendota_text-table_";
	pendota.uiAttrSelectorId = "_pendota-attr-selector_";
	pendota.uiItemInputClass = "_pendota_form-control_";
	pendota.copy_icon_url = chrome.extension.getURL(
		"/src/ui/images/copy_icon.ico"
	);
	pendota.pendo_target_url = chrome.extension.getURL(
		"/src/ui/images/pendo_target.png"
	);
	pendota.plus_sq_url = chrome.extension.getURL(
		"/src/ui/images/plus-square.png"
	);
	pendota.tagBuild = [];

	// Global status variables
	pendota._pendota_isVisible_ = false;
	pendota._pendota_isLocked_ = false;
	pendota.lastSizzleId;
	pendota.sizzleCountObj = {};

	/*
	* Removes the hidden class from the element
	* @param {element}	elm
	*/
	pendota.show = function(elm) {
		elm.classList.remove(pendota.hiddenClass);
	}

	/*
	* Adds the hidden class from the element
	* @param {element}	elm
	*/
	pendota.hide = function(elm) {
		elm.classList.add(pendota.hiddenClass);
	}

	/*
	 * Listeners for a signal to enter locked/unlocked state
	 * @param {message} e
	 */
	pendota.lockSignalListener = function (e) {
		if (typeof e.data !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (
				typeof data.type !== "undefined" &&
				data.type == "LOCK_SWITCH"
			) {
				pendota.lockSwitch(data.isLocked);
			}
		}
	};

	/*
	 * Listens for a signal to change the current locked element.
	 * @param {message} e
	 */
	pendota.updateSignalListener = function (e) {
		if (typeof e.data !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (
				typeof data.type !== "undefined" &&
				data.type == "PENDOTA_UPDATE"
			) {
				pendota.updatePendotaContents(data.element);

				// Reset parent traversal tree
				pendota._pendota_elem_array_ = [];
				pendota._pendota_elem_array_[0] = data.element;
			}
		}
	};

	/*
	 * Changes the UI between locked and unlocked states. Locks if isLocked = true, otherwise unlocks.
	 * @param {boolean} isLocked
	 */
	pendota.lockSwitch = function (isLocked) {
		// locks or unlocks the pendota element scanner
		// var el = e.target;
		pendota.clearAutoTag();
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
	};

	pendota.setLockMessage = function(newMsg) {
		document.getElementById(pendota.statusMessageId).innerHTML = newMsg;
	}

	/*
	 * Forces UI to locked state. Is idempotent.
	 */
	pendota.lockedState = function () {
		// Locks the scanner and UI
		$("#_pendota-lock-icon_").html(
			'<i class="_pendota-feather-locked_" data-feather="crosshair"></i>'
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
		pendota.updateAutoTag();
	};

	/*
	 * Forces UI to unlocked state. Is idempotent.
	 */
	pendota.unlockedState = function () {
		// if already locked, unlocks instead
		// Set the lock icon to starting "unlocked" state
		$("#_pendota-lock-icon_").html(
			'<i class="_pendota-feather-unlocked_" data-feather="crosshair"></i>'
		);
		$("#_pendota-lock-icon_").removeClass("_pendota-icon-locked_");
		$("#_pendota-parent-up_").addClass("_pendota-hide-arrow_");
		$("#_pendota-parent-down_").addClass("_pendota-hide-arrow_");
		feather.replace();

		// Set a status text letting the user the targeting is ready
		pendota._pendota_isLocked_ = false;
		pendota.updateAutoTag();
	};

	/*
	 * Reusable function that copies the content of an element with ID matching inputId to the clipboard.
	 * @param {element} inputId
	 */
	pendota.copyToClipboard = function (elm) {
		if (!elm) return; // do nothing if empty

		// Select the text field
		elm.select();
		elm.setSelectionRange(0, 99999); // For mobile devices

		// Copy the text field
		document.execCommand("copy");

		elm.setSelectionRange(0,0); // clear highlight when done
	};

	/*
	 * The listener that copies the identified value to the clipboard
	 * @param {event} e
	 */
	pendota.copyListener = function (e) {
		inp = e.target.closest('tr').querySelector('.' + pendota.uiItemInputClass);
		pendota.copyToClipboard(inp);
	};

	/* 
	* The listener that copies the whole built tag to the clipboard
	* @param {event} e
	*/
	pendota.tagBuildCopyListener = function(e) {
		var stayHidden = document.getElementById(pendota.sizzlerInputFormId).classList.contains(pendota.hiddenClass);
		pendota.show(document.getElementById(pendota.sizzlerInputFormId));
		pendota.copyToClipboard(document.getElementById(pendota.sizzlerInputId));
		if (stayHidden) pendota.hide(document.getElementById(pendota.sizzlerInputFormId));
	}

	/* 
	* The listener that copies the whole built tag to the clipboard
	* @param {event} e
	*/
	pendota.tagBuildFreetextListener = function(e) {
		var tB = document.getElementById(pendota.tagBuilderId);
		if (pendota.isFreetextMode()) {
			pendota.hide(document.getElementById(pendota.sizzlerInputFormId));
			pendota.show(document.getElementById(pendota.tagBuilderNonFreetextId));
			document.getElementById(pendota.tagBuilderFreetextBtnId).setAttribute("title", "FreeType mode");
			document.getElementById(pendota.tagBuilderFreetextIconId).dataset.feather = "type";
			feather.replace();
			tB.dataset.freetextMode = "off";
			pendota.updateAutoTag();
		} else {
			pendota.show(document.getElementById(pendota.sizzlerInputFormId));
			pendota.hide(document.getElementById(pendota.tagBuilderNonFreetextId));
			var inpField = document.getElementById(pendota.sizzlerInputId);
			inpField.selectionStart = inpField.selectionEnd = inpField.value.length;
			inpField.focus();
			document.getElementById(pendota.tagBuilderFreetextBtnId).setAttribute("title", "Builder mode");
			document.getElementById(pendota.tagBuilderFreetextIconId).dataset.feather = "layers";
			feather.replace();
			tB.dataset.freetextMode = "on";
			pendota.updateAutoTag();
		}
	}

	/*

	/*
	 * Finds all copy icons currently in the UI and applies the copy function targeted at the corresponding box.
	 */
	pendota.applyCopyFunction = function () {
		$("." + pendota.copyBtnClass).off("click", pendota.copyListener);
		$("." + pendota.copyBtnClass).on("click", pendota.copyListener);
	};

	/*
	* Returns the current tier in the element parent array
	* @returns {bool} is contains rule eligible
	*/
	pendota.checkContainsRuleEligibility = function() {
		var tier = pendota._pendota_elem_array_.length - 1;
		for (var i = 0; i < pendota.tagBuild.length; i++) {
			var checkTier = pendota.tagBuild[i].tier;
			if (tier === checkTier) {
				return true;
			}
			if (tier > checkTier) {
				return false;
			}
		}
		return false;
	} 

	/*
	 * Adds an attribute in the appropriate location in the tag being built.
	 * @param {int}		tier
	 * @param {string}	attribute
	 * @param {string}	value
	 */
	pendota.addToTagBuild = function (tier, attribute, value) {
		if (typeof value == "undefined" || value == "") return; //No empty values
		if (["type", "id"].includes(attribute)) {
			var newVal = { tier: tier, items: [] };
			newVal[attribute] = { value: value };
			// single values (type, id)
			if (pendota.tagBuild.length == 0) {
				pendota.tagBuild.push(newVal);
				pendota.checkElmForRemoval(pendota.tagBuild.length - 1);
			} else {
				for (var n = 0; n < pendota.tagBuild.length; n++) {
					if (pendota.tagBuild[n].tier == tier) {
						var obj = pendota.tagBuild[n];
						if (
							typeof obj[attribute] == "undefined" ||
							obj[attribute].value != value
						) {
							obj[attribute] = { value: value };
							pendota.checkElmForRemoval(n);
							break;
						} else {
							break;
						}
					} else if (pendota.tagBuild[n].tier < tier) {
						pendota.tagBuild = pendota.injectIntoArray(
							pendota.tagBuild,
							newVal,
							n
						);
						pendota.checkElmForRemoval(n);
						break;
					} else if (n == pendota.tagBuild.length - 1) {
						pendota.tagBuild.push(newVal);
						pendota.checkElmForRemoval(n);
						break;
					}
				}
			}
		} else {
			// compounding values (class, custom attributes)
			var newVal = { attribute: attribute, value: value };
			if (pendota.tagBuild.length == 0) {
				pendota.tagBuild.push({ tier: tier, items: [newVal] });
				pendota.checkElmForRemoval(pendota.tagBuild.length - 1);
			} else {
				for (var i = 0; i < pendota.tagBuild.length; i++) {
					if (pendota.tagBuild[i].tier == tier) {
						var itemsArr = pendota.tagBuild[i].items;
						var isNew = true;
						for (var j = 0; j < itemsArr.length; j++) {
							if (
								itemsArr[j].attribute == attribute &&
								itemsArr[j].value == value
							) {
								// Duplicate class; don't overwrite
								isNew = false;
								break;
							}
						}
						if (isNew) {
							pendota.tagBuild[i].items.push(newVal);
							pendota.checkElmForRemoval(i);
						}
						break;
					} else if (pendota.tagBuild[i].tier < tier) {
						pendota.tagBuild = pendota.injectIntoArray(
							pendota.tagBuild,
							{ tier: tier, items: [newVal] },
							i
						);
						pendota.checkElmForRemoval(i);
						break;
					} else if (i == pendota.tagBuild.length - 1) {
						pendota.tagBuild.push({ tier: tier, items: [newVal] });
						pendota.checkElmForRemoval(i);
						break;
					}
				}
			}
		}
		pendota.updateAutoTag();
	};

	pendota.highlightActiveElm = function() {
		var activeTier = pendota._pendota_elem_array_.length - 1;
		for (var i = 0; i < pendota.tagBuild.length; i++) {
			var thisElm = document.querySelector(`[data-build-index="${i}"`);
			if (pendota.tagBuild[i].tier === activeTier) {
				thisElm.classList.add(pendota.activeTagItemClass);
			} else {
				thisElm.classList.remove(pendota.activeTagItemClass);
			}
		}
	}

	/*
	 * Removes an item from the tag build
	 */
	pendota.removeFromTagBuild = function (
		objectIndex,
		spcItem,
		itemIndex
	) {
		if (spcItem === "type") {
			delete pendota.tagBuild[objectIndex].type;
		} else if (spcItem === "id") {
			delete pendota.tagBuild[objectIndex].id;
		} else {
			pendota.tagBuild[objectIndex].items.splice(itemIndex, 1);
		}
		pendota.checkElmForRemoval(objectIndex);
		pendota.updateAutoTag();
	};

	pendota.checkAddBtnsEligibility = function() {
		var addBtns = document.getElementsByClassName(pendota.addToBuildBtnClass);
		var freeTextMode = pendota.isFreetextMode();
		var isLocked = pendota._pendota_isLocked_;
		for (var i = 0; i < addBtns.length; i++) {
			var inp = addBtns[i].closest('tr').querySelector('.' + pendota.uiItemInputClass);
			if (!isLocked) pendota.hide(addBtns[i]);
			else if (inp.dataset.rawvalue === "") pendota.hide(addBtns[i]);
			else if (freeTextMode) pendota.show(addBtns[i]);
			else if (!!addBtns[i].closest('#' + pendota.uiTextBlockId) && !pendota.checkContainsRuleEligibility()) pendota.hide(addBtns[i])
			else pendota.show(addBtns[i]);
		}
	}

	/*
	* Checks if a tag element should be cleared from the build entirely because of it's lack of sufficient items
	* @param {int}	the build index
	*/
	pendota.checkElmForRemoval = function(objIndex) {
		var obj = pendota.tagBuild[objIndex];
		if (
			typeof obj.type == "undefined" &&
			typeof obj.id == "undefined" &&
			obj.items.filter(function(v) {
				return (v.attribute !== "contains")
			}).length == 0
		) {
			// If element is empty, remove it
			pendota.tagBuild.splice(objIndex, 1);
		}
	}

	/*
	 * When passed an event, removes a tag item from the build if found in parent tree
	 * @param {event} e
	 */
	pendota.removeFromTagBuildListener = function (e) {
		if (typeof e !== "undefined") {
			tgt = e.target;
			if (tgt.closest("." + pendota.tagItemClass)) {
				item = tgt.closest("." + pendota.tagItemClass);
				elm = tgt.closest("." + pendota.tagElmClass);
				objIndex = elm.dataset.buildIndex;
				if ("isType" in item.dataset) {
					pendota.removeFromTagBuild(objIndex, "type");
				} else if ("isId" in item.dataset) {
					pendota.removeFromTagBuild(objIndex, "id");
				} else {
					pendota.removeFromTagBuild(
						objIndex,
						'',
						item.dataset.itemIndex
					);
				}
			}
		}
	};

	/*
	 * Accepts descriptors of an element in the tag build and injects the provided rule
	 */
	pendota.setTagBuildRule = function (
		objectIndex,
		spcItem,
		itemIndex,
		rule
	) {
		if (spcItem === "type") {
			pendota.tagBuild[objectIndex].type.rule = rule;
		} else if (spcItem === "id") {
			pendota.tagBuild[objectIndex].id.rule = rule;
		} else {
			pendota.tagBuild[objectIndex].items[itemIndex].rule = rule;
		}
		pendota.updateAutoTag();
	};

	pendota.setTagBuildRuleFromEvent = function (e, rule) {
		if (typeof(e) != "undefined" && e.target.closest('.' + pendota.tagItemClass)) {
			var item = e.target.closest('.' + pendota.tagItemClass);
			var elm = e.target.closest('.' + pendota.tagElmClass);
			var objInd = elm.dataset.buildIndex;
			var itemInd = item.dataset.itemIndex;
			if ("isType" in item.dataset) pendota.setTagBuildRule(objInd, "type", itemInd, rule);
			else if  ("isId" in item.dataset) pendota.setTagBuildRule(objInd, "id", itemInd, rule);
			else pendota.setTagBuildRule(objInd, '', itemInd, rule);
		}
	}

	/*
	 * When passed an event, resets a tag item to default from the build if found in parent tree
	 */
	pendota.resetTagItemListener = function (e) {
			pendota.setTagBuildRuleFromEvent(e);
	};

	/*
	 * Accepts descriptors of an element in the tag build and returns the requested rule
	 */
	pendota.getTagBuildRule = function (objectIndex, isType, isId, itemIndex) {
		if (isType) {
			return pendota.tagBuild[objectIndex].type.rule;
		} else if (isId) {
			return pendota.tagBuild[objectIndex].id.rule;
		} else {
			return pendota.tagBuild[objectIndex].items[itemIndex].rule;
		}
	};

	/*
	 * Checks the current tag build and updates the auto-built tag and free-text tag to reflect it
	 */
	pendota.updateAutoTag = function () {
		if (document.getElementById(pendota.autoTagsId)) {
			var fullTag = document.createElement("div");
			var rawFullTag = "";
			for (var o = 0; o < pendota.tagBuild.length; o++) {
				var nextElm = pendota.convertObjToTag(pendota.tagBuild[o]);
				var tmpSpan = nextElm["htmlTagOut"];
				tmpSpan.classList.add("_pendota-tag-elm_");
				tmpSpan.dataset.buildIndex = o;
				tmpSpan.title = nextElm["tagOut"];
				rawFullTag += " " + nextElm["tagOut"];
				fullTag.appendChild(tmpSpan);
			}
			document.getElementById(pendota.autoTagsId).innerHTML = "";
			document.getElementById(pendota.autoTagsId).appendChild(fullTag);
			rawFullTag = rawFullTag.trim();
			pendota.changeSizzlerValue(rawFullTag);
			$("." + pendota.tagItemTextClass).on("click", function (e) {
				pendota.displayTagItemDropdown(
					e.target.closest("." + pendota.tagItemClass)
				);
			});
			pendota.setGuidanceMessage();
			pendota.checkTagClearEligibility();
			pendota.checkPlaceholderEligibility();
			pendota.checkAddBtnsEligibility();
			pendota.highlightActiveElm();
		}
	};

	/*
	 * Clears the existing auto-built tag and updates the displayed values
	 */
	pendota.clearAutoTag = function () {
		pendota.tagBuild = [];
		pendota.updateAutoTag();
	};

	pendota.setGuidanceMessage = function() {
		if (!pendota._pendota_isLocked_) pendota.setLockMessage("Click any feature to select it");
		else if (pendota.isFreetextMode()) pendota.setLockMessage("Power User - FreeType Mode");
		else if (pendota.tagBuild.length > 0) pendota.setLockMessage("You can edit pink tag items by clicking on them");
		else pendota.setLockMessage("Now build a tag using the [+] buttons!")
	}

	pendota.checkPlaceholderEligibility = function() {
		var isLocked = pendota._pendota_isLocked_;
		if(pendota.tagBuild.length === 0 && isLocked) {
			pendota.show(document.getElementById(pendota.tagBuilderPlaceholderId));
		} else {
			pendota.hide(document.getElementById(pendota.tagBuilderPlaceholderId));
		}
	}

	pendota.checkTagClearEligibility = function() {
		console.log('Checking clear button...');
		var szlInp = document.getElementById(pendota.sizzlerInputId);
		var clrBtn = document.getElementById(pendota.tagBuilderClearBtnId);
		if (szlInp.value.length) pendota.show(clrBtn);
		else pendota.hide(clrBtn);
	}

	/*
	 * Accepts a tagBuild object as input and returns it in valid CSS selector syntax
	 * @param 	{object}	buildObj
	 * @returns	{string}	the build object in CSS syntax
	 * @returns	{string}	the build object with HTML wrappers in CSS syntax
	 */
	pendota.convertObjToTag = function (buildObj) {
		var tagOut = "";
		var htmlTagOut = document.createElement("span");

		var repeatSteps = function (attr, val, rule) {
			addStr = pendota.createCSSRule(attr, val, rule);
			tagOut += addStr;
			let tmpSpan = document.createElement("span");
			tmpSpan.classList.add(pendota.tagItemClass);
			tmpSpan.setAttribute("no-drag","");
			let tmpTextSpan = document.createElement("span");
			tmpTextSpan.classList.add(pendota.tagItemTextClass);
			tmpTextSpan.innerText = addStr;
			tmpTextSpan.title = addStr;
			tmpTextSpan.dataset.rawValue = val;
			tmpSpan.append(tmpTextSpan);
			tmpSpan.appendChild(pendota.createTagItemDropdown(attr, rule));
			htmlTagOut.append(tmpSpan);
			return tmpSpan;
		};

		if (buildObj.hasOwnProperty("type")) {
			let typeSpan = repeatSteps(
				"type",
				buildObj.type.value,
				buildObj.type.rule
			);
			typeSpan.dataset.isType = "";
			typeSpan.dataset.attr = "type";
		}

		if (buildObj.hasOwnProperty("id")) {
			let idSpan = repeatSteps("id", buildObj.id.value, buildObj.id.rule);
			idSpan.dataset.isId = "";
			idSpan.dataset.attr = "id";
		}

		if (buildObj.hasOwnProperty("items")) {
			itemArr = buildObj.items;
			for (var i = 0; i < itemArr.length; i++) {
				let item = itemArr[i];
				let itemSpan = repeatSteps(
					item.attribute,
					item.value,
					item.rule
				);
				itemSpan.dataset.itemIndex = i;
				itemSpan.dataset.attr = item.attribute;
			}
		}

		return { tagOut: tagOut, htmlTagOut: htmlTagOut };
	};

	/*
	 * Generates a dropdown menu for different attribute types
	 * @param {string} attribute
	 */
	pendota.createTagItemDropdown = function (attribute, rule) {
		var ddContent = document.createElement("div");
		ddContent.classList.add(pendota.tagItemDdClass);

		var addDdItem = function (text) {
			var ddItem = document.createElement("a");
			ddItem.classList.add(pendota.tagItemDdItemClass);
			ddItem.innerText = text;
			ddContent.append(ddItem);
			return ddItem;
		};

		var addDdItemInput = function (anchorItem, useRawVal = true) {
			var inpDiv = document.createElement("div");
			inpDiv.classList.add(pendota.tagItemDdInpDivClass);
			if (useRawVal) inpDiv.dataset.useRawVal = "";
			var inp = document.createElement("textarea");
			inp.classList.add(pendota.tagItemDdInpClass);
			inp.setAttribute("spellcheck", "false");
			inp.setAttribute("autocomplete","off");
			var inpSubmit = document.createElement("button");
			inpSubmit.classList.add(pendota.tagItemDdInpSubmitClass);
			inpSubmit.innerText = "✓";
			inp.addEventListener("keyup", function(e) {
				if(event.key === "Enter") {
					inpSubmit.click();
				}
			})
			inpDiv.appendChild(inp);
			inpDiv.appendChild(inpSubmit);
			anchorItem.appendChild(inpDiv);
			anchorItem.classList.add("_pendota-has-side-input_");
			anchorItem.addEventListener("click", pendota.showDdInpField);
			//anchorItem.addEventListener("mouseenter", pendota.showDdInpField);
			return inpDiv;
		};

		// Reset button
		if (typeof(rule) !== "undefined") {
			var resetBtn = addDdItem("Reset");
			resetBtn.addEventListener("click", pendota.resetTagItemListener);
		}

		// Exists rule button
		// Only applies to custom attributes
		if (!["type", "id", "class", "contains"].includes(attribute)) {
			var existsBtn = addDdItem("Exists");
			existsBtn.addEventListener("click", function(e) {
				pendota.setTagBuildRuleFromEvent(e, {type: "exists", value: ""})
			});
		}

		// Begins with rule button
		// Not allowed with classes
		if (!["type", "class", "contains"].includes(attribute)) {
			var beginsBtn = addDdItem("Begins with");
			var beginsInpDiv = addDdItemInput(beginsBtn);
			beginsInpDiv.querySelector('.' + pendota.tagItemDdInpSubmitClass).addEventListener("click", function(e) {
				pendota.setTagBuildRuleFromEvent(e, {type: "beginsWith", value: e.target.parentNode.querySelector('.' + pendota.tagItemDdInpClass).value.trim()});
			})
			
		}

		// Includes rule button
		if (attribute != "type" && attribute != "contains") {
			var includesBtn = addDdItem("Includes");
			var includesInpDiv = addDdItemInput(includesBtn);
			includesInpDiv.querySelector('.' + pendota.tagItemDdInpSubmitClass).addEventListener("click", function(e) {
				pendota.setTagBuildRuleFromEvent(e, {type: "includes", value: e.target.parentNode.querySelector('.' + pendota.tagItemDdInpClass).value.trim()});
			});
		}

		// Ends with rule button
		// Not allowed with classes
		if (!["type", "class", "contains"].includes(attribute)) {
			var endsBtn = addDdItem("Ends with");
			var endsInpDiv = addDdItemInput(endsBtn);
			endsInpDiv.querySelector('.' + pendota.tagItemDdInpSubmitClass).addEventListener("click", function(e) {
				pendota.setTagBuildRuleFromEvent(e, {type: "endsWith", value: e.target.parentNode.querySelector('.' + pendota.tagItemDdInpClass).value.trim()});
			})
			
		}

		// Contains rule button
		if (attribute == "contains") {
			var containsBtn = addDdItem("Contains");
			var containsInpDiv = addDdItemInput(containsBtn);
			containsInpDiv.querySelector('.' + pendota.tagItemDdInpSubmitClass).addEventListener("click", function(e) {
				pendota.setTagBuildRuleFromEvent(e, {type: "contains", value: e.target.parentNode.querySelector('.' + pendota.tagItemDdInpClass).value.trim()});
			})
		}

		// Custom rule button
		// Allows freetext entry
		var customBtn = addDdItem("Custom");
		var customInpDiv = addDdItemInput(customBtn, false);
		customInpDiv.querySelector('.' + pendota.tagItemDdInpSubmitClass).addEventListener("click", function(e) {
			pendota.setTagBuildRuleFromEvent(e, {type: "custom", value: e.target.parentNode.querySelector('.' + pendota.tagItemDdInpClass).value});
		})

		// Delete button
		var deleteBtn = addDdItem("Delete");
		deleteBtn.addEventListener("click", pendota.removeFromTagBuildListener);

		return ddContent;
	};

	/*
	 * Displays the dropdown under a specific tag item
	 * @param {node} elm
	 */
	pendota.displayTagItemDropdown = function (elm) {
		var ddContent = elm.querySelector("." + pendota.tagItemDdClass);
		ddContent.classList.add(pendota.ddShowClass);
	};

	/*
	 * Hides all open tag item dropdowns
	 * @param {event} e
	 */
	pendota.hideTagItemDropdowns = function (e) {
		if (typeof(e) != "undefined") tgt = e.target;
		if (
			typeof (e) == "undefined" ||
			!tgt.closest("." + pendota.tagItemDdClass)
		) {
			var dropdowns = document.getElementsByClassName(
				pendota.tagItemDdClass
			);
			for (var i = 0; i < dropdowns.length; i++) {
				dropdowns[i].classList.remove(pendota.ddShowClass);
			}
			pendota.hideAllDdInpFields();
		}
	};

	/*
	* Displays a dropdown side-input field
	* @param {node} elm
	*/
	pendota.showDdInpField = function(ev) {
		pendota.hideAllDdInpFields(ev);
		if (!ev.target.closest('.' + pendota.tagItemDdInpDivClass)) {
			elm = ev.target.closest('.' + pendota.tagItemDdItemClass);
			var inpDiv = elm.querySelector('.' + pendota.tagItemDdInpDivClass);
			var inpField = elm.querySelector('.' + pendota.tagItemDdInpClass);
			if ("useRawVal" in inpDiv.dataset) {
				inpField.value = elm.closest('.' + pendota.tagItemClass).querySelector('.' + pendota.tagItemTextClass).dataset.rawValue;
			} else {
				inpField.value = elm.closest('.' + pendota.tagItemClass).querySelector('.' + pendota.tagItemTextClass).textContent;
			}
			inpDiv.classList.add(pendota.ddShowClass);
			inpField.selectionStart = inpField.selectionEnd = inpField.value.length;
			inpField.focus();
		}
	}

	/*
	 * Hides all open tag item dropdowns
	 * @param {event} e
	 */
	pendota.hideAllDdInpFields = function(e) {
		if (typeof(e) != "undefined") tgt = e.target;
		if (
			typeof (e) == "undefined" ||
			!tgt.closest("." + pendota.tagItemDdInpDivClass)
		) {
			var inpFields = document.getElementsByClassName(
				pendota.tagItemDdInpDivClass
			);
			for (var j = 0; j < inpFields.length; j++) {
				inpFields[j].classList.remove(pendota.ddShowClass);
			}
		}
	}

	/*
	 * Generates a valid CSS attribute rule from a tagBuild item
	 * @param {object} item
	 */
	pendota.createCSSRule = function (attribute, itemValue, rule) {
		var outStr = "";
		if (typeof(rule) !== "undefined" && rule.type === "custom") {
			outStr = rule.value;
		} else if (typeof(rule) !== "undefined" && rule.type === "contains") {
			outStr = ":contains(\"" + rule.value + "\")";
		} else if (attribute === "type") {
			// item is an element type
			outStr = itemValue;
		} else if (attribute === "contains") {
			// item is an element type
			outStr = ":contains(\"" + itemValue + "\")";
		} else if ((typeof (rule) === "undefined") && attribute === "class") {
			// item is a class with no modifying rules
			outStr = "." + itemValue;
		} else if ((typeof (rule) === "undefined") && attribute === "id") {
			// item is an id with no modifying rules
			outStr = "#" + itemValue;
		} else if (typeof rule !== "undefined" && attribute === "class") {
			// begin and ends with rules on classes are tricky; better not to allow them
			switch (rule.type) {
				case "includes":
					outStr = "[" + attribute + '*="' + rule.value + '"]';
					break;
				default:
					// rule type not recognized, default to equals
					outStr = "[" + attribute + '="' + itemValue + '"]';
			}
		} else if (typeof rule !== "undefined") {
			// item has a modifying rule and is not a class or type
			switch (rule.type) {
				case "beginsWith":
					outStr = "[" + attribute + '^="' + rule.value + '"]';
					break;
				case "endsWith":
					outStr = "[" + attribute + '$="' + rule.value + '"]';
					break;
				case "includes":
					outStr = "[" + attribute + '*="' + rule.value + '"]';
					break;
				case "exists":
					outStr = "[" + attribute + ']';
					break;
				case "custom":
					outStr = rule.value;
					break;
				default:
					// rule type not recognized, default to equals
					outStr = "[" + attribute + '="' + itemValue + '"]';
			}
		} else {
			// item is not a type/class/id and has no modifying rules
			outStr = "[" + attribute + '="' + itemValue + '"]';
		}

		return outStr;
	};

	/*
	 * Returns a new array with value injected at the provided index, and all subsequent values pushed back one index
	 * @param {array} inArray
	 * @param {any}	 value
	 * @param {index} int
	 */
	pendota.injectIntoArray = function (inArray, value, index) {
		return inArray
			.slice(0, index)
			.concat(value)
			.concat(inArray.slice(index));
	};

	pendota.isFreetextMode = function() {
		var tB = document.getElementById(pendota.tagBuilderId);
		if (tB.dataset.freetextMode === "on") return true;
		else return false;
	}

	/*
	 * The listener function that adds a value to the tag build
	 * @param {event} e
	 */
	pendota.addToBuildListener = function (e) {
		var inp = e.target.closest('tr').querySelector('.' + pendota.uiItemInputClass);
		var sizzlerInput = document.getElementById(pendota.sizzlerInputId);
		
		if (pendota.isFreetextMode()) {
			pendota.insertAtCursor(sizzlerInput, pendota.createCSSRule(inp.dataset.attr, inp.dataset.rawvalue));
			pendota.triggerEvent("input", sizzlerInput);
			document.getElementById(pendota.sizzlerInputId).focus();
		} else {
			pendota.addToTagBuild(
			pendota._pendota_elem_array_.length - 1,
			inp.dataset.attr,
			inp.dataset.rawvalue
		);
		}
		
	};

	pendota.insertAtCursor = function(myField, myValue) {
		if (myField.selectionStart || myField.selectionStart == '0') {
			var startPos = myField.selectionStart;
			var endPos = myField.selectionEnd;
			myField.value = myField.value.substring(0, endPos)
				+ myValue
				+ myField.value.substring(endPos, myField.value.length);
			myField.selectionStart = myField.selectionEnd = endPos + myValue.length;
		} else {
			myField.value += myValue;
		}
	}

	/*
	 * Finds all plus_square icons currently in the UI and applies the addtobuild function targeted at the corresponding box.
	 */
	pendota.applyAddFunction = function () {
		$("._pendota-addtobuild-btn_:not('._pendota-disabled_')").off("click", pendota.addToBuildListener);
		$("._pendota-addtobuild-btn_:not('._pendota-disabled_')").on("click", pendota.addToBuildListener);
	};

	/*
	* Returns the currently selected custom attribute
	* @return {string}	the attribute type
	*/
	pendota.getCurrentAttr = function() {
		var selector = document.getElementById(pendota.uiAttrSelectorId).querySelector('select');
		return selector.options[selector.selectedIndex].value;
	}

	/*
	 * Updates the element, ID, and classes in the tagging aid UI.
	 * @param {element} e
	 */
	pendota.updatePendotaContents = function (e) {
		// Get the target element's Id and Classes
		var _id_ = (!!e ? e.id : "") || "";
		var _classNames_ = (!!e ? e.classes : []) || [];
		var _attrs_ = (!!e ? e.attributes : []) || [];
		var _textContent_ = (!!e && !!e.textContent ? e.textContent.trim() : "") || "";
		_textContent_ = _textContent_.replace(/(["])/g, "\\$1");
		var _elemType_ = (!!e && !!e.nodeName ? e.nodeName.toLowerCase() : "") || ""; // stylistic choice to do lower case

		var createItemRow = function(attr, rawVal, fmtVal) {
			var tr = document.createElement('tr');
			var inpTd = document.createElement('td');
			inpTd.setAttribute("width", "82%");
			inpTd.classList.add("_pendota_input-row_");
			var inp = document.createElement('input')
			inp.setAttribute('no-drag', "");
			inp.classList.add("_pendota_form-control_")
			inp.classList.add("_pendota_" + attr + "-result_")
			inp.setAttribute("type", "text");
			inp.value = fmtVal;
			inp.dataset.attr = attr;
			inp.dataset.rawvalue = rawVal;
			inp.dataset.value = fmtVal;
			inp.setAttribute("title", fmtVal);
			inp.setAttribute("readonly","");
			inpTd.appendChild(inp);
			tr.appendChild(inpTd);
			var breakTd = document.createElement('td');
			breakTd.setAttribute("width", "2%")
			breakTd.classList.add("_pendota_input-row_");
			breakTd.innerHTML = "&nbsp;"
			tr.appendChild(breakTd);
			var plusTd = document.createElement('td');
			plusTd.setAttribute("width", "8%");
			plusTd.classList.add("_pendota_input-row_");
			var plusBtn = document.createElement('a');
			plusBtn.classList.add(pendota.addToBuildBtnClass);
			plusBtn.classList.add("_pendota-button_");
			plusBtn.setAttribute("title", "Add to tag");
			plusBtn.setAttribute("href","javascript:void(0);");
			plusBtn.setAttribute("no-drag","");
			var plusIcon = document.createElement('i');
			plusIcon.classList.add("_pendota-addtobuild-icon_");
			plusIcon.classList.add("_pendota-button-icon_");
			plusIcon.dataset.feather = "plus-square";
			plusBtn.appendChild(plusIcon);
			plusTd.appendChild(plusBtn);
			tr.appendChild(plusTd);
			var copyTd = document.createElement('td');
			copyTd.setAttribute("width", "8%");
			copyTd.classList.add("_pendota_input-row_");
			var copyBtn = document.createElement('a');
			copyBtn.classList.add(pendota.copyBtnClass);
			copyBtn.classList.add("_pendota-button_");
			copyBtn.setAttribute("no-drag","");
			copyBtn.setAttribute("title", "Add to tag");
			copyBtn.setAttribute("href","javascript:void(0);");
			var copyIcon = document.createElement('i');
			copyIcon.classList.add("_pendota-copy-icon_");
			copyIcon.classList.add("_pendota-button-icon_");
			copyIcon.dataset.feather = "copy";
			copyBtn.appendChild(copyIcon);
			copyTd.appendChild(copyBtn);
			tr.appendChild(copyTd);
			return tr;
		}

		var createSelector = function(values) {
			var sel = document.createElement('select');
			sel.classList.add('_pendota-select-dropdown_');
			for (var v = 0; v < values.length; v++) {
				var opt = document.createElement('option');
				opt.innerText = values[v];
				opt.value = values[v];
				if (v === 0) opt.setAttribute("selected", "");
				sel.appendChild(opt);
			}
			return sel;
		}

		var updateCustomAttrsList = function(attrs) {
			document.getElementById(pendota.uiAttrTableId).innerHTML = "";
			var selAttr = pendota.getCurrentAttr();
			//document.getElementById(pendota.uiAttrTableId).appendChild(createItemRow(selAttr, '', '[' + selAttr + ']'));
			filtAttrs = attrs.filter(function(v) {
				return v.attribute === selAttr;
			});
			for (var j = 0; j < filtAttrs.length; j++) {
				document.getElementById(pendota.uiAttrTableId).appendChild(createItemRow(selAttr, filtAttrs[j].value, '[' + selAttr + '="' + filtAttrs[j].value + '"]'))
			}
			feather.replace();
			pendota.checkAddBtnsEligibility();
			pendota.applyCopyFunction();
			pendota.applyAddFunction();
		}
		
		// Clear existing values
		document.getElementById(pendota.uiTypeTableId).innerHTML = "";
		document.getElementById(pendota.uiTextTableId).innerHTML = "";
		document.getElementById(pendota.uiIdTableId).innerHTML = "";
		document.getElementById(pendota.uiClassTableId).innerHTML = "";
		document.getElementById(pendota.uiAttrTableId).innerHTML = "";

		// Add type
		document.getElementById(pendota.uiTypeTableId).appendChild(createItemRow("type", _elemType_, _elemType_));

		// Add text
		if (_textContent_ === "") {
			document.getElementById(pendota.uiTextBlockId).classList.add("_pendota-hidden_");
		} else {
			document.getElementById(pendota.uiTextBlockId).classList.remove("_pendota-hidden_");
			document.getElementById(pendota.uiTextTableId).appendChild(createItemRow("contains", _textContent_, ":contains(\"" + _textContent_ + "\")"));
		}
		
		// Add id
		document.getElementById(pendota.uiIdTableId).appendChild(createItemRow("id", _id_, '#' + _id_));

		// If no classes, show a blank
		if (_classNames_.length === 0) document.getElementById(pendota.uiClassTableId).appendChild(createItemRow("class", '', '.' ));
		// Build class rows
		for (var i = 0; i < _classNames_.length; i++) {
			document.getElementById(pendota.uiClassTableId).appendChild(createItemRow("class", _classNames_[i], '.' + _classNames_[i]));
		}

		// If no attribute types, hide the box
		if (_attrs_.length === 0) {
			document.getElementById(pendota.uiAttrBlockId).classList.add("_pendota-hidden_");
		} else {
			document.getElementById(pendota.uiAttrBlockId).classList.remove("_pendota-hidden_");
			var attrsOnly = _attrs_.map(function(v) {return v.attribute});
			document.getElementById(pendota.uiAttrSelectorId).innerHTML = "";
			var attrSel = createSelector(attrsOnly);
			attrSel.addEventListener("change", function() {
				updateCustomAttrsList(_attrs_);
			});
			document.getElementById(pendota.uiAttrSelectorId).appendChild(attrSel);
			updateCustomAttrsList(_attrs_);
		}

		// Define the copy and add functions for all icons
		feather.replace();
		pendota.updateAutoTag();
		pendota.highlightActiveElm();
		pendota.applyCopyFunction();
		pendota.applyAddFunction();
	};

	/*
	 * Sends a signal to activate the Sizzler on all frames and directly activates in the UI.
	 */
	pendota._pendotaActivateSizzler = function () {
		pendota.sendMessageToAllFrames(window, {
			type: "SIZZLE_SWITCH",
			isActive: true,
		});
		pendota.signalSizzlerUpdate();
		document.getElementById(pendota.sizzlerBtnId).classList.add("_pendota-text-button-clicked_");
		document.getElementById(pendota.sizzlerIconId).classList.add("_pendota-clicked_");
		document.getElementById(pendota.sizzlerIconId).innerText = "STOP";
		feather.replace();
		document
			.getElementById(pendota.sizzlerInputId)
			.addEventListener("input", pendota.signalSizzlerUpdate);
		document
			.getElementById(pendota.sizzlerBtnId)
			.removeEventListener("click", pendota._pendotaActivateSizzler);
		document
			.getElementById(pendota.sizzlerBtnId)
			.addEventListener("click", pendota._pendotaDeactivateSizzler);
		window.addEventListener(
			"message",
			pendota.sizzlerCountSignalListener,
			true
		);
	};

	/*
	 * Sends a signal to deactivate the Sizzler on all frames and removes it from the UI.
	 */
	pendota._pendotaDeactivateSizzler = function () {
		pendota.sendMessageToAllFrames(window, {
			type: "SIZZLE_SWITCH",
			isActive: false,
		});
		document.getElementById(pendota.sizzlerBtnId).classList.remove("_pendota-text-button-clicked_");
		document.getElementById(pendota.sizzlerIconId).classList.remove("_pendota-clicked_");
		document.getElementById(pendota.sizzlerIconId).innerText = "TEST";
		feather.replace();
		$("#" + pendota.sizzlerCountId).html("");
		document
			.getElementById(pendota.sizzlerInputId)
			.removeEventListener("input", pendota.signalSizzlerUpdate);
		document
			.getElementById(pendota.sizzlerBtnId)
			.removeEventListener("click", pendota._pendotaDeactivateSizzler);
		document
			.getElementById(pendota.sizzlerBtnId)
			.addEventListener("click", pendota._pendotaActivateSizzler);
		window.removeEventListener(
			"message",
			pendota.sizzlerCountSignalListener,
			true
		);
	};

	/*
	 * Changes the sizzler input value and triggers an input change
	 * @param {string} newValue
	 */
	pendota.changeSizzlerValue = function (newValue) {
		var sizzlerInput = document.getElementById(pendota.sizzlerInputId);
		sizzlerInput.value = newValue.trim();
		pendota.triggerEvent("input", sizzlerInput);
		pendota.triggerEvent("change", sizzlerInput);
	};

	pendota.triggerEvent = function(type, target) {
		var evt = new Event(type, {
			bubbles: true,
			cancelable: true,
		});
		target.dispatchEvent(evt);
	}

	/*
	 * Sends a message to all frames to change the current sizzler selector to the value in the UI.
	 */
	pendota.signalSizzlerUpdate = function () {
		pendota.sizzleCountObj = {};
		pendota.lastSizzleId = pendota.fiveDigitId();
		pendota.sendMessageToAllFrames(window, {
			type: "SIZZLE_UPDATE",
			selector: document.getElementById(pendota.sizzlerInputId).value,
			updateId: pendota.lastSizzleId,
		});
	};

	/*
	 * As count updates come in, builds a count of Sizzler matches in every frame.
	 * @param {int} value
	 */
	pendota.addToSizzleCount = function (value, srcFrame) {
		pendota.sizzleCountObj[srcFrame] = value;
		var sizzleCount = 0;
		var sizzleVals = Object.values(pendota.sizzleCountObj);
		for (var i = 0; i < sizzleVals.length; i++) {
			sizzleCount += parseInt(sizzleVals[i]);
		}
		document.getElementById(pendota.sizzlerCountId).innerText =
			sizzleCount;
	};

	/*
	 * Listens for incoming count report signals. Does not add them if they do not match the most recent Sizzler updateId.
	 * @param {message} e
	 */
	pendota.sizzlerCountSignalListener = function (e) {
		if (typeof e.data !== "undefined") {
			var data = pendota.tryParseJSON(e.data);
			if (
				typeof data.type !== "undefined" &&
				data.type == "SIZZLE_COUNT" &&
				typeof data.sourceFrame !== "undefined" &&
				data.updateId == pendota.lastSizzleId
			) {
				pendota.addToSizzleCount(parseInt(data.count), data.sourceFrame);
			}
		}
	};

	/*
	 * Randomizes a 5-digit ID for the sizzler update process.
	 * @returns {int}	a random int, always 5 digits
	 */
	pendota.fiveDigitId = function () {
		return Math.floor(Math.random() * 90000) + 10000;
	};

	/*
	* Replaces newline characters in the input string with a unicode symbol
	*/
	pendota.removeLinebreaks = function(str) { 
		return str.replace( /[\r\n]+/gm, "⏎" ); 
	} 

	/*
	 * Displays the tagging aid UI and turns on relevant listeners.
	 */
	pendota._pendotaInsertUI_ = function () {
		//Injects the tag assistant UI
		pendota._pendota_isVisible_ = true;
		pendota._pendota_isLocked_ = false;

		// add listener for lock signal
		window.addEventListener("message", pendota.lockSignalListener, true);

		// add listener for update signal
		window.addEventListener("message", pendota.updateSignalListener, true);

		// add listener to close dropdowns
		window.addEventListener("click", pendota.hideTagItemDropdowns, true);

		// Append popup div to the body
		$.get(chrome.extension.getURL("src/ui/pendota.html"))
			.then((data) => {
				$("body").append(data);
			})
			.then(() => {
				// Execute functions after appending UI

				// avoid events bubbling out of tagging aid
 				pendota.listenersToBlock.forEach(function (ltype) {
					document.querySelector('.' + pendota.wrapperClass).addEventListener(ltype, pendota.blockerFunction);
				}); 

				document.getElementById(pendota.sizzlerInputId).addEventListener("input", pendota.checkTagClearEligibility);

				feather.replace(); // sets feather icons (e.g. lock icon)

				var position = { x: 0, y: 0 };
				// Implements the interact.js library to make the assistant draggable
				var dragObj = interact("._pendota-draggable_").draggable({
					ignoreFrom: "[no-drag]"
				});

				dragObj.on('dragmove', function(event){
					position.x += event.dx;
					position.y += event.dy;

					event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
				}, true);

				// Points the image source for static images stored with extension
				$("._pendota-copy-icon_").attr("src", pendota.copy_icon_url);
				$("._pendota-addtobuild-icon_").attr(
					"src",
					pendota.plus_sq_url
				);
				$("#_pendota-target-img_").attr(
					"src",
					pendota.pendo_target_url
				);

				// Create blank values
				pendota.updatePendotaContents();

				// Set the tag builder button functions
				document.getElementById(pendota.tagBuilderCopyBtnId).addEventListener("click", pendota.tagBuildCopyListener);
				document.getElementById(pendota.tagBuilderFreetextBtnId).addEventListener("click", pendota.tagBuildFreetextListener);
				document.getElementById(pendota.tagBuilderClearBtnId).addEventListener("click", pendota.clearAutoTag);

				// Sets the onclick function for the parent tree traversal upwards
				document
					.getElementById("_pendota-parent-up_")
					.addEventListener("click", function (ev) {
						currentElem =
							pendota._pendota_elem_array_[
								pendota._pendota_elem_array_.length - 1
							];
						if (currentElem.nodeName.toLowerCase() != "html") {
							pendota.sendMessageToAllFrames(window, {
								type: "PENDOTA_TRAVERSE_UP",
							});
							parentElem = {};
							parentElem = currentElem.parentNode; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form
							parentElem.textContent = currentElem.textContent; // pass the lowest child's textContent up the tree
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
							pendota._pendota_elem_array_[
								pendota._pendota_elem_array_.length - 1
							];
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
				document
					.getElementById(pendota.sizzlerBtnId)
					.addEventListener("click", pendota._pendotaActivateSizzler);

				// set the scanner in motion the first time the UI is displayed
				pendota.unlockedState();

				// Apply the copy function to all copy icons
				pendota.applyCopyFunction();
				pendota.applyAddFunction();

				// Call highlight toggler when clicking enter
				var szlInput = document.getElementById(pendota.sizzlerInputId);
				szlInput.addEventListener("keyup", function(e) {
					if(event.key === "Enter") {
						e.preventDefault();
						document.getElementById(pendota.sizzlerBtnId).click();
						szlInput.value = szlInput.value.substring(0, szlInput.value.length - 1);
					}
				})
			});
	};

	/*
	 * Removes the tagging aid UI and listeners.
	 */
	pendota._pendotaRemoveUI_ = function () {
		pendota._pendota_isVisible_ = false;

		$('.' + pendota.wrapperClass).remove(); // Remove all html

		pendota._pendota_elem_array_ = [];
		pendota.clearAutoTag();

		// Remove listeners
		window.removeEventListener("message", pendota.lockSignalListener, true);
		window.removeEventListener(
			"message",
			pendota.updateSignalListener,
			true
		);
		window.removeEventListener("click", pendota.hideTagItemDropdowns, true);
	};
}
