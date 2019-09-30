// Check if UI has already been loaded
if (typeof _pendota_isVisible_ == "undefined" || !_pendota_isVisible_) {
    _pendotaInsertUI_();
} else {
    _pendotaRemoveUI_();
}

// Stores an array of elements traversed by the parent arrows. Resets on every mouseover when in unlocked state
var _pendota_elem_array_ = [];

function _pendotaInsertUI_() { //Injects the tag assistant UI
    _pendota_isVisible_ = true;

    // Append CSS File to head
    //$("head").append('<link href="' + chrome.extension.getURL('src/css/bootstrap.min.css') + '" rel="stylesheet">');
    $("head").append('<link href="' + chrome.extension.getURL('src/css/custom.css') + '" rel="stylesheet">');

    // Append popup div to the body
    $.get(chrome.extension.getURL('src/ui/popup.html')).then( (data) => {
        $("body").append(data);
    }).then(() => { // Execute functions after appending UI

        feather.replace(); // sets feather icons (e.g. lock icon)

        // reused variables
        var _id_ = "";
        var _classNames_ = [];
        var _elemType_ = "";
        var copy_icon_url = chrome.extension.getURL('/src/ui/images/copy_icon.ico');
        var pendo_target_url = chrome.extension.getURL('/src/ui/images/pendo_target.png');

        const position = { x: 0, y: 0 }

        // Implements the interact.js library to make the assistant draggable
        interact('._pendota-draggable_').draggable({
        listeners: {
            move (event) {
            position.x += event.dx
            position.y += event.dy

            event.target.style.transform =
                `translate(${position.x}px, ${position.y}px)`
            },
        }
        })

        // Points the image source for static images stored with extension
        $('._pendota-copy-icon_').attr('src', copy_icon_url);
        $('#_pendota-target-img_').attr('src', pendo_target_url);
        //$('#_pendota_exit_img_container_').attr('onclick', "_pendotaRemoveUI_()");

        // Define the basic mouseover functionality
        function startMouseover(){

            // Set the lock icon to starting "unlocked" state
            $('#_pendota-lock-icon_').html('<i class="_pendota-feather-unlocked_" data-feather="unlock"></i>');
            $('#_pendota-parent-up_').addClass("_pendota-hide-arrow_");
            $('#_pendota-parent-down_').addClass("_pendota-hide-arrow_");
            feather.replace();

            // Set a status text letting the user the targeting is ready
            document.getElementById('_pendota_status_').innerText = "Ready to inspect!  Click an element to lock info.\n(Alt + Shift + L)";
            
            window.onmouseover=(function(e) { // Defines the actual mouseover function
                e.preventDefault();
                /* 
                    preventDefault() stops the regular actions that take place on a webpage
                    e.g. follow a link, submit form, etc.
                    It does NOT stop custom javascript interactions (e.g. show a modal).
                    Figuring out how to temporarily freeze these actions would be a good overall
                    improvement to the extension.
                */

                // Move the outline to the current item
                updateOutline(e.target);

                // Set new child element in parent traversal tree
                _pendota_elem_array_ = [];
                _pendota_elem_array_[0] = {"obj": e.target}; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form

                // Update the Tagging Aid contents
                updatePendotaContents(e.target);

                // Define the copy function for all copy icons
                applyCopyFunction();

            });
        };

        // A click event will "lock" the fields in their current state.  Clicking again will re-enable.
        window.onclick = function (e) {
            if (e.target.id == '_pendota_exit_img_container_' || e.target.id == '_pendota_exit_img_' || _elemType_ == 'line') {
                _pendotaRemoveUI_();
            } else {
                lockSwitch(e);
            }
        };

        window.onkeydown = function (e) {
            if(e.altKey && e.shiftKey && e.keyCode == 76) { // alt + shift + L to lock/unlock
                lockSwitch(e);
            }

            if(e.keyCode == 27) { // ESC to exit pendota UI
                _pendotaRemoveUI_();
            }
        };


        function lockSwitch(e) { // locks or unlocks the pendota element scanner
            e.preventDefault();
            var el = e.target;

            if (el.id == "_pendota-tag-assistant_") { return; }
            while (el.parentNode) { // traverses through parent elements -- will not lock on the pendota interface
                if (el.parentNode.id == "_pendota-tag-assistant_") { return; }
                el = el.parentNode;
            }

            if(window.onmouseover != null) { // if not on pendota interface, locks the scanner
                document.getElementById('_pendota_status_').textContent = "Element Locked.  Click anywhere to reset.";
                window.onmouseover = null;
                $('#_pendota-lock-icon_').html('<i class="_pendota-feather-locked_" data-feather="lock"></i>');
                $('#_pendota-parent-up_').removeClass("_pendota-hide-arrow_");
                $('#_pendota-parent-down_').removeClass("_pendota-hide-arrow_");
                feather.replace();
                $('#_pendota-feather-up-arrow_').attr("class","_pendota-parent-arrow_ _pendota-active-arrow_");
                $('#_pendota-feather-down-arrow_').attr("class","_pendota-parent-arrow_ _pendota-disabled-arrow_");
            } else { // if already locked, unlocks instead
                startMouseover();
            }
        }

        // Sets the onclick function for the parent tree traversal upwards
        document.getElementById('_pendota-parent-up_').onclick = function (ev) {
            currentElem = _pendota_elem_array_[_pendota_elem_array_.length - 1];
            if (currentElem["obj"].nodeName.toLowerCase() != "html") {
                parentElem = {};
                parentElem["obj"] = currentElem["obj"].parentNode; // html object elements act weird if passed directly to an array. Storing this way keeps them in object form
                _pendota_elem_array_.push(parentElem);
                updatePendotaContents(parentElem["obj"]);
                updateOutline(parentElem["obj"]);
                $('#_pendota-feather-down-arrow_').attr("class","_pendota-parent-arrow_ _pendota-active-arrow_");
                if(parentElem["obj"].nodeName.toLowerCase() == "html") {
                    $('#_pendota-feather-up-arrow_').attr("class","_pendota-parent-arrow_ _pendota-disabled-arrow_");
                }
            }
        };

        // Sets the onclick funtion for the parent tree traveral downwards
        document.getElementById('_pendota-parent-down_').onclick = function (ev) {
            currentElem = _pendota_elem_array_[_pendota_elem_array_.length - 1];
            if (_pendota_elem_array_.length > 1) {
                _pendota_elem_array_.pop();
                childElem = _pendota_elem_array_[_pendota_elem_array_.length - 1];
                updatePendotaContents(childElem["obj"]);
                updateOutline(childElem["obj"]);
                $('#_pendota-feather-up-arrow_').attr("class","_pendota-parent-arrow_ _pendota-active-arrow_");
                if(_pendota_elem_array_.length == 1) {
                    $('#_pendota-feather-down-arrow_').attr("class","_pendota-parent-arrow_ _pendota-disabled-arrow_");
                }
            }
        };

        startMouseover(); // sets the scanner in motion the first time the UI is displayed

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
            $(e).addClass('_pendota-outline_');
            $("*").not(e).removeClass('_pendota-outline_');
        }

        // Apply the copy function to all copy icons
        function applyCopyFunction() {
            $("._pendota-copy-link_").on("click", function(e) {
                e.stopPropagation();
                e.preventDefault();
                copyToClipboard(e.currentTarget.id);
            }) 
        };

        applyCopyFunction();
        
        // Takes an html element in JSON form as an input and updates the Tagging Aid form to display its details
        function updatePendotaContents(e) {
            // Get the target element's Id and Classes    
            _id_ = e.id;

            _classNames_ = $(e).attr("class"); // jQuery's class attribute is robust, handles svg's and other unique element types

            if (typeof _classNames_ != "undefined") {
                _classNames_ = _classNames_.split(/\s+/).filter((cls) => { // should not split on just ' ' because classes can be separated by other forms of whitespace
                    return cls != "_pendota-outline_"; // block pendota outline results from output
                }); 
                if (_classNames_.length == 0) {
                    _classNames_ = ['']; // if the only class was _pendota-outline_ the array would be empty, resulting in .undefined as a class
                }
            } else {
                _classNames_ = [''];
            }

            _elemType_ = e.nodeName.toLowerCase(); // stylistic choice
            
            var appendedHTML = ""; // clear extra class results

            // Set the result boxes that are always visible
            $('#_pendota_type-result_').val("" + _elemType_);
            $('#_pendota_id-result_').val("#" + _id_);
            $('#_pendota_class-result-0_').val("." + _classNames_[0]);
            $("#_pendota_template-table_").empty();
            
            // Build extra class spaces
            for (i=1; i < _classNames_.length; i++) {
            appendedHTML = appendedHTML +
            '<tr>' +
                '<td width="90%" class="_pendota_input-row_"><input class="_pendota_form-control_ _pendota_class-result_" type="text" id="_pendota_class-result-' + i + '_" value=".' + _classNames_[i] + '" readonly></td>' +
                '<td width="2%" class="_pendota_input-row_">&nbsp;</td>' +
                '<td width="8%" class="_pendota_input-row_">' +
                '<div id="_pendota_class-result-' + i + '_" class="_pendota-copy-link_");\'>' +
                    '<a href="#"><img class=_pendota-copy-icon_ src=' + copy_icon_url + ' width="20"></a>' +
                '</div>' +
                '</td>' +
                '</tr>';
            }

            // Append extra class spaces
            if(_classNames_.length > 1) {
                $("#_pendota_template-table_").html(appendedHTML);
            }  
        }

    });
}

// Defines function to later remove the Pendo Tag Assistant UI
function _pendotaRemoveUI_() {
    _pendota_isVisible_ = false;

    $("#_pendota-tag-assistant_").remove(); // Remove all html
    $("*").removeClass("_pendota-outline_"); // Remove the outline

    // Remove all assigned function
    // Do NOT use jQuery for these--more difficult to unassign and reassign
    window.onclick = function(e) {};
    window.onmouseover = function(e) {};
    window.onkeydown = function(e) {};
}