var _pendotaUIIsInjected = true;

// Stores an array of elements traversed by the parent arrows. Resets on every mouseover when in unlocked state
var _pendota_elem_array_ = [];

// listen for lock signal
function lockSignalListener(e) {
    if (e.data.type && (e.data.type == "LOCK_SWITCH")) {
        lockSwitch(e.data.isLocked);
    }
}

// listen for update signal
function updateSignalListener(e) {
    if (e.data.type && (e.data.type == "PENDOTA_UPDATE")) {
        updatePendotaContents(e.data.element);

        // Reset parent traversal tree
        _pendota_elem_array_ = [];
        _pendota_elem_array_[0] = e.data.element;
    }
}

// Global status variables
var _pendota_isVisible_ = false;
var _pendota_isLocked_ = false;

function lockSwitch(isLocked) {
    // locks or unlocks the pendota element scanner
    // var el = e.target;
    if (typeof(isLocked) !== "undefined") {
        if (isLocked) lockedState();
        else unlockedState()
    } else {
        if (!_pendota_isLocked_) {
            // if not on pendota interface, locks the scanner
            lockedState();
        } else {
            unlockedState();
        }
    }
}

function lockedState() {
    // Locks the scanner and UI
    document.getElementById("_pendota_status_").textContent =
        "Element Locked.  Click anywhere to reset.";
    //stopMouseover();
    $("#_pendota-lock-icon_").html(
        '<i class="_pendota-feather-locked_" data-feather="lock"></i>'
    );
    $("#_pendota-lock-icon_").addClass("_pendota-icon-locked_");
    $("#_pendota-parent-up_").removeClass(
        "_pendota-hide-arrow_"
    );
    $("#_pendota-parent-down_").removeClass(
        "_pendota-hide-arrow_"
    );
    feather.replace();
    $("#_pendota-feather-up-arrow_").attr(
        "class",
        "_pendota-parent-arrow_ _pendota-active-arrow_"
    );
    $("#_pendota-feather-down-arrow_").attr(
        "class",
        "_pendota-parent-arrow_ _pendota-disabled-arrow_"
    );
    _pendota_isLocked_ = true;

}

function unlockedState() {
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
    _pendota_isLocked_ = false;
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

// Apply the copy function to all copy icons
function applyCopyFunction() {
    $("._pendota-copy-link_").on("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        copyToClipboard(e.currentTarget.id);
    });
}

// Takes an html element in JSON form as an input and updates the Tagging Aid form to display its details
function updatePendotaContents(e) {
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
            copy_icon_url +
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
    applyCopyFunction();
}

// Turns on sizzle highlighting function and adjusts visuals to match
function _pendotaActivateHighlight() {
    window.postMessage({type:"SIZZLE_SWITCH", isActive: true});
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
    window.postMessage({type:"SIZZLE_SWITCH", isActive: true});
    sizzleIsActive = false;
    $("#" + sizzlerBtnId).removeClass("_pendota-clicked");
    $("#" + sizzlerBtnId).html("Test");
    $(window).off("resize", _pendota_highlight);
    $(window).off("scroll", _pendota_highlight);
    $("#" + sizzlerCountId).html("--");
    _pendota_remove_highlight();
}

function _pendotaInsertUI_() {
    //Injects the tag assistant UI
    _pendota_isVisible_ = true;
    _pendota_isLocked_ = false;

    // add listener for lock signal
    window.addEventListener("message", lockSignalListener, true);

    // add listener for update signal
    window.addEventListener("message", updateSignalListener, true);

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
                ignoreFrom: '[no-drag]',
                listeners: {
                    move(event) {
                        position.x += event.dx;
                        position.y += event.dy;

                        event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    },
                },
            });

            // Points the image source for static images stored with extension
            $("._pendota-copy-icon_").attr("src", copy_icon_url);
            $("#_pendota-target-img_").attr("src", pendo_target_url);

            // Sets the onclick function for the parent tree traversal upwards
            document
                .getElementById("_pendota-parent-up_")
                .addEventListener("click", function (ev) {
                    window.postMessage({type:"PENDOTA_TRAVERSE_UP"});
                    currentElem =
                        _pendota_elem_array_[_pendota_elem_array_.length - 1];
                    if (currentElem.nodeName.toLowerCase() != "html") {
                        parentElem = {};
                        parentElem = currentElem.parentNode; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form
                        _pendota_elem_array_.push(parentElem);
                        updatePendotaContents(parentElem);
                        //updateOutline(parentElem["obj"]);
                        $("#_pendota-feather-down-arrow_").attr(
                            "class",
                            "_pendota-parent-arrow_ _pendota-active-arrow_"
                        );
                        if (
                            parentElem.nodeName.toLowerCase() == "html"
                        ) {
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
                    window.postMessage({type:"PENDOTA_TRAVERSE_DOWN"});
                    currentElem =
                        _pendota_elem_array_[_pendota_elem_array_.length - 1];
                    if (_pendota_elem_array_.length > 1) {
                        _pendota_elem_array_.pop();
                        childElem =
                            _pendota_elem_array_[
                                _pendota_elem_array_.length - 1
                            ];
                        updatePendotaContents(childElem);
                        //updateOutline(childElem["obj"]);
                        $("#_pendota-feather-up-arrow_").attr(
                            "class",
                            "_pendota-parent-arrow_ _pendota-active-arrow_"
                        );
                        if (_pendota_elem_array_.length == 1) {
                            $("#_pendota-feather-down-arrow_").attr(
                                "class",
                                "_pendota-parent-arrow_ _pendota-disabled-arrow_"
                            );
                        }
                    }
                });

            // prep the sizzler in an off state
            var sizzleIsActive = false;
            $("#" + sizzlerBtnId).on("click", _pendotaToggleHighlight);

            // set the scanner in motion the first time the UI is displayed
            unlockedState();

            // Apply the copy function to all copy icons
            applyCopyFunction();

            // Call highlight toggler when clicking enter
            $("#_pendota-sizzler-form_").on("submit", function (e) {
                e.preventDefault();
                _pendotaToggleHighlight();
            });
        });
}

// Defines function to later remove the Pendo Tag Assistant UI
function _pendotaRemoveUI_() {
    _pendota_isVisible_ = false;

    $("#_pendota-wrapper_").remove(); // Remove all html

    // Remove listeners
    window.removeEventListener("message", lockSignalListener, true);
    window.removeEventListener("message", updateSignalListener, true);
}