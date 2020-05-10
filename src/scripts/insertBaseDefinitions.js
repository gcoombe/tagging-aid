// Global listener functions so they can be removed easily
var lockListener, keyLockListener, mouseoverListener;
function blockerFunction(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Global status variables
var _pendota_isLocked_ = false;
var sizzleIsActive = false;

// reused variables
const sizzlerInputId = "_pendota-sizzler_";
const sizzlerBtnId = "_pendota-sizzler-icon_";
const taggingAidId = "_pendota-tag-assistant_";
const sizzlerCountId = "_pendota-sizzler-count_";
const copy_icon_url = chrome.extension.getURL(
    "/src/ui/images/copy_icon.ico"
);
const pendo_target_url = chrome.extension.getURL(
    "/src/ui/images/pendo_target.png"
);

function mouseoverListener(e) {
    // Defines the actual mouseover function
    e.preventDefault();
    e.stopPropagation();

    // Don't process mouseover if over tagging aid
    if (!someParentHasID(e.target, taggingAidId)) {
        // Move the outline to the current item
        updateOutline(e.target);

        // Set new child element in parent traversal tree
        _pendota_elem_array_ = [];
        _pendota_elem_array_[0] = { obj: e.target }; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form

        // Update the Tagging Aid contents
        updatePendotaContents(e.target);
    }
};

// Define the basic mouseover functionality
function startMouseover() {
    window.removeEventListener("mouseover", blockerFunction, true);
    window.addEventListener("mouseover", mouseoverListener, true);
}

function stopMouseover() {
    window.addEventListener("mouseover", blockerFunction, true);
    window.removeEventListener('mouseover', mouseoverListener, true);
}

// A click event will "lock" the fields in their current state.  Clicking again will re-enable. If the X button is clicked, this overrides the lock switch functionality.
function lockListener(e) {
    e.preventDefault();
    el = e.target;
    if (someParentHasID(el, "_pendota_exit_img_container_")) {
        _pendotaRemoveUI_();
    } else {
        lockSwitch(e);
    }
};

function keyLockListener(e) {
    if (e.altKey && e.shiftKey && e.keyCode == 76) {
        // alt + shift + L to lock/unlock
        lockSwitch(e);
    }

    if (e.keyCode == 27) {
        // ESC to exit pendota UI
        _pendotaRemoveUI_();
    }
};

function lockSwitch(e, optional ) {
    // locks or unlocks the pendota element scanner
    e.preventDefault();
    var el = e.target;

    if (!_pendota_isLocked_ && !someParentHasID(el, taggingAidId)) {
        // if not on pendota interface, locks the scanner
        e.stopPropagation();
        lockedState(e);
    } else if (
        _pendota_isLocked_ &&
        (!someParentHasID(el, taggingAidId) ||
            someParentHasID(el, "_pendota-lock-icon_"))
    ) {
        e.stopPropagation();
        unlockedState(e);
    }
}


// Define the copy function
function copyToClipboard(inputId) {
    // Get the text field
    var copyText = document.getElementById(inputId);

    // Select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices

    // Copy the text field
    document.execCommand("copy");
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

// Apply the copy function to all copy icons
function applyCopyFunction() {
    $("._pendota-copy-link_").on("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        copyToClipboard(e.currentTarget.id);
    });
}



// Turns on sizzle highlighting function and adjusts visuals to match
function _pendotaActivateHighlight() {
    sizzleIsActive = true;
    $("#" + sizzlerBtnId).addClass("_pendota-clicked");
    $("#" + sizzlerBtnId).html("Stop");
    _pendota_highlight();
    $(window).on("resize", _pendota_highlight);
    $(window).on("scroll", _pendota_highlight);
    $("#" + sizzlerInputId).on("input", _pendota_highlight);
}

// Turns off sizzle highlighting and adjusts visuals to match
function _pendotaDeactivateHighlight() {
    sizzleIsActive = false;
    $("#" + sizzlerBtnId).removeClass("_pendota-clicked");
    $("#" + sizzlerBtnId).html("Test");
    $(window).off("resize", _pendota_highlight);
    $(window).off("scroll", _pendota_highlight);
    $("#" + sizzlerCountId).html("--");
    _pendota_remove_highlight();
}

// Swaps between activated and deactivated status for sizzle highlighting
function _pendotaToggleHighlight() {
    if (sizzleIsActive) _pendotaDeactivateHighlight();
    else _pendotaActivateHighlight();
}

// Function that adds the highlighting element to all matched elements if they are not part of the tagging aid
function _pendota_highlight() {
    selector = document.getElementById(sizzlerInputId).value;
    _pendota_remove_highlight();
    if (sizzleIsActive && selector > "") {
        try {
            const selectedElms = document.querySelectorAll(
                selector
            );
            var numMatch = 0;
            for (let elm of selectedElms) {
                if (!someParentHasID(elm, taggingAidId)) {
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
        $("#" + sizzlerCountId).html("(" + numMatch + ")");
    } else if (sizzleIsActive && selector == "") {
        $("#" + sizzlerCountId).html("(0)");
    }
}

function _pendota_remove_highlight() {
    $("._pendota-highlight-selector_").remove();
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
