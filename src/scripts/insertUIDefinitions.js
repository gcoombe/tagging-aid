// Stores an array of elements traversed by the parent arrows. Resets on every mouseover when in unlocked state
var _pendota_elem_array_ = [];

// Global status variables
var _pendota_isVisible_ = false;

// Takes an html element in JSON form as an input and updates the Tagging Aid form to display its details
function updatePendotaContents(e) {
    // Get the target element's Id and Classes
    var _id_ = e.id;
    var _classNames_ = [];
    _classNames_ = $(e).attr("class"); // jQuery's class attribute is robust, handles svg's and other unique element types

    if (typeof _classNames_ != "undefined") {
        _classNames_ = _classNames_.split(/\s+/).filter((cls) => {
            // should not split on just ' ' because classes can be separated by other forms of whitespace
            return cls != "_pendota-outline_"; // block pendota outline results from output
        });
        if (_classNames_.length == 0) {
            _classNames_ = [""]; // if the only class was _pendota-outline_ the array would be empty, resulting in .undefined as a class
        }
    } else {
        _classNames_ = [""];
    }

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
            '<td width="90%" class="_pendota_input-row_"><input class="_pendota_form-control_ _pendota_class-result_" type="text" id="_pendota_class-result-' +
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


function _pendotaInsertUI_() {
	//Injects the tag assistant UI
	_pendota_isVisible_ = true;
	_pendota_isLocked_ = false;

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

			// add listener for click to lock events
			window.addEventListener("click", lockListener, true);

			// add listener for keyboard lock events
            window.addEventListener('keydown', keyLockListener);

			// Sets the onclick function for the parent tree traversal upwards
			document
				.getElementById("_pendota-parent-up_")
				.addEventListener("click", function (ev) {
					currentElem =
						_pendota_elem_array_[_pendota_elem_array_.length - 1];
					if (currentElem["obj"].nodeName.toLowerCase() != "html") {
						parentElem = {};
						parentElem["obj"] = currentElem["obj"].parentNode; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form
						_pendota_elem_array_.push(parentElem);
						updatePendotaContents(parentElem["obj"]);
						updateOutline(parentElem["obj"]);
						$("#_pendota-feather-down-arrow_").attr(
							"class",
							"_pendota-parent-arrow_ _pendota-active-arrow_"
						);
						if (
							parentElem["obj"].nodeName.toLowerCase() == "html"
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
					currentElem =
						_pendota_elem_array_[_pendota_elem_array_.length - 1];
					if (_pendota_elem_array_.length > 1) {
						_pendota_elem_array_.pop();
						childElem =
							_pendota_elem_array_[
								_pendota_elem_array_.length - 1
							];
						updatePendotaContents(childElem["obj"]);
						updateOutline(childElem["obj"]);
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
			startMouseover(); 

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
	$("._pendota-outline_").remove(); // Remove the outline
	$("._pendota-highlight-selector_").remove(); // Remove selector highlighter

	// Remove all assigned functions
	window.removeEventListener("click", lockListener, true);
    window.removeEventListener("mouseover", mouseoverListener, true);
    window.removeEventListener("mouseover", blockerFunction, true);
	window.removeEventListener("keydown", keyLockListener);
}