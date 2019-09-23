//Injects the tag assistant UI

// Append CSS File to head
//$("head").append('<link href="' + chrome.extension.getURL('src/css/bootstrap.min.css') + '" rel="stylesheet">');
$("head").append('<link href="' + chrome.extension.getURL('src/css/custom.css') + '" rel="stylesheet">');

// Append popup div to the body
$.get(chrome.extension.getURL('src/ui/popup.html')).then( (data) => {
    $("body").append(data);
}).then(() => { // Execute functions after appending UI
    feather.replace();
    var _id_ = "";
    var _classNames_ = [];
    var _elemType_ = "";
    //var pendota = document.getElementById("_pendota-tag-assistant_");
    var copy_icon_url = chrome.extension.getURL('/src/ui/images/copy_icon.ico');
    var pendo_target_url = chrome.extension.getURL('/src/ui/images/pendo_target.png');

    const position = { x: 0, y: 0 }

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

    $('._pendota-copy-icon_').attr('src', copy_icon_url);
    $('#_pendota-target-img_').attr('src', pendo_target_url);

    function startMouseover(){
    $('#_pendota-lock-icon_').html('<i class="_pendota-feather-unlocked_" data-feather="unlock"></i>');
    feather.replace();

    // Set a status text letting the user the targeting is ready
    document.getElementById('_pendota_status_').textContent = "Ready to inspect!  Click an element to lock info.";
        
    window.onmouseover=(function(e) {
        e.preventDefault();
        // Get the target element's Id and Classes    
        _id_ = e.target.id;
        _classNames_ = $(e.target).attr("class")
        if (typeof _classNames_ != "undefined") {
            _classNames_ = _classNames_.split(/\s+/).filter((cls) => { // should not split on just ' ' because classes can be separated by other forms of whitespace
                return cls != "_pendota-outline_"; // block pendota outline results from output
            }); 
            if (_classNames_.length == 0) {
                _classNames_ = [''];
            }
        } else {
            _classNames_ = [''];
        }

        _elemType_ = e.target.nodeName.toLowerCase();

        // Controls highlight box
        $(e.target).addClass('_pendota-outline_');
        $("*").not(e.target).removeClass('_pendota-outline_');
        
        var appendedHTML = "";

        $('#_pendota_type-result_').val("" + _elemType_);
        $('#_pendota_id-result_').val("#" + _id_);
        $('#_pendota_class-result-0_').val("." + _classNames_[0]);
        $("#_pendota_template-table_").empty();
        
        //Build extra class spaces
        for (i=1; i < _classNames_.length; i++) {
        appendedHTML = appendedHTML +
        '<tr>' +
            '<td width="90%" class="_pendota_input-row_"><input class="_pendota_form-control_ _pendota_class-result_" type="text" id="_pendota_class-result-' + i + '_" value=".' + _classNames_[i] + '" readonly></td>' +
            '<td width="2%" class="_pendota_input-row_">&nbsp;</td>' +
            '<td width="8%" class="_pendota_input-row_">' +
            '<div id="_pendota_class-result-' + i + '_" class="_pendota-copy-link_");\'>' +
                '<a href="#"><img src=' + copy_icon_url + ' width="20"></a>' +
            '</div>' +
            '</td>' +
            '</tr>';
        }

        if(_classNames_.length > 1) {
        $("#_pendota_template-table_").html(appendedHTML);
        }  

        $("._pendota-copy-link_").on("click", function(e) {
            e.stopPropagation();
            copyToClipboard(e.currentTarget.id);
        })
    });
    };

    // A click event will "lock" the fields in their current state.  Clicking again will re-enable.
    window.onclick = function (e) {
        lockSwitch(e);
    };

    function lockSwitch(e) {
        e.preventDefault();
        e.stopPropagation();
        var el = e.target;
        if (el.id == "_pendota-tag-assistant_") { return; }
        while (el.parentNode) {
            if (el.parentNode.id == "_pendota-tag-assistant_") { return; }
            el = el.parentNode;
        }
        if(window.onmouseover != null) {
            document.getElementById('_pendota_status_').textContent = "Element Locked.  Click anywhere to reset.";
            window.onmouseover = null;
            $('#_pendota-lock-icon_').html('<i class="_pendota-feather-locked_" data-feather="lock"></i>');
            feather.replace();
        } else {
            startMouseover();
        }
    }

    startMouseover();

    $("._pendota-copy-link_").on("click", function(e) {
        e.stopPropagation();
        copyToClipboard(e.currentTarget.id);
    })

    function copyToClipboard(inputId) {
        
        /* Get the text field */
        var copyText = document.getElementById(inputId);
        
        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/
        
        /* Copy the text inside the text field */
        document.execCommand("copy");
        }

});

