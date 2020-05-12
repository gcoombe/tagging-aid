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
const lockedIconClass = "_pendota-icon-locked_";
const copy_icon_url = chrome.extension.getURL(
    "/src/ui/images/copy_icon.ico"
);
const pendo_target_url = chrome.extension.getURL(
    "/src/ui/images/pendo_target.png"
);

function mouseoverListener(e) {
    // Defines the actual mouseover function
    blockerFunction(e);

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

function passableObject(element) {
    if (!element) return null;
    else {
        var outElm = {}
        outElm.id = element.id;
        outElm.classes = jqClassToArr($(element).attr("class"));
        outElm.parentNode = passableObject(element.parentNode);
    }
    return outElm;
}

function signalLockSwitch(e) {
    e.preventDefault();
    if (someParentHasClass(e.target, lockedIconClass) || !someParentHasID(e.target, taggingAidId))
    {
        e.stopPropagation();
        window.postMessage({type:"LOCK_SWITCH"}, '*');
    }
}

// A click event will "lock" the fields in their current state.  Clicking again will re-enable. If the X button is clicked, this overrides the lock switch functionality.
function lockListener(e) {
    e.preventDefault();
    el = e.target;
    if (someParentHasID(el, "_pendota_exit_img_container_")) {
        _pendotaRemoveUI_();
    } else {
        signalLockSwitch(e);
    }
};

function keyLockListener(e) {
    if (e.altKey && e.shiftKey && e.keyCode == 76) {
        // alt + shift + L to lock/unlock
        signalLockSwitch(e);
    }

    if (e.keyCode == 27) {
        // ESC to exit pendota UI
        _pendotaRemoveUI_();
    }
};

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

function jqClassToArr(classes) {
    if (typeof classes != "undefined") {
        classes = classes.split(/\s+/).filter((cls) => {
            // should not split on just ' ' because classes can be separated by other forms of whitespace
            return cls != "_pendota-outline_"; // block pendota outline results from output
        });
        if (classes.length == 0) {
            classes = [""]; // if the only class was _pendota-outline_ the array would be empty, resulting in .undefined as a class
        }
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

console.log("Class test: ", someParentHasClass($("h1:contains('Joe Mohr')")[0],"jumbotron"));

// Function to check if specified class is anywhere in the parent tree
function someParentHasClass(element, className) {
	if (!element) return null;
    else {
        var classes = jqClassToArr($(element).attr("class"));
        if (!!classes && classes.includes(className)) return true;
        else return !element.parentNode
        ? false
        : someParentHasClass(element.parentNode, className);
    }
}