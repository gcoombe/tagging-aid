//Injects the tag assistant UI

// Append CSS File to head
//$("head").append('<link href="' + chrome.extension.getURL('src/css/bootstrap.min.css') + '" rel="stylesheet">');
$("head").append('<link href="' + chrome.extension.getURL('src/css/custom.css') + '" rel="stylesheet">');

// Append popup div to the body
$.get(chrome.extension.getURL('src/ui/popup.html')).then( (data) => {
    $("body").append(data);
    console.log('Appended body');
}).then(() => { // Execute functions after appending UI
    var _id_ = "";
    var _classNames_ = [];
    var _elemType_ = "";
    var copy_icon_url = chrome.extension.getURL('/src/ui/images/copy_icon.ico');
        var pendo_target_url = chrome.extension.getURL('/src/ui/images/pendo_target.png');

        $('._pendota-copy-icon_').attr('src', copy_icon_url);
        $('#_pendota-target-img_').attr('src', pendo_target_url);

    function startMouseover(){
    // Set a status text letting the user the targeting is ready
    document.getElementById('_pendota_status_').textContent = "Ready to inspect!  Click an element to lock info.";

    window.onmouseover=(function(e) {
        // Get the target element's Id and Classes    
        _id_ = e.target.id;
        _classNames_ = e.target.className.split(" ");
        _elemType_ = e.target.nodeName;

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
            '<div onclick=\'copyToClipboard("_pendota_class-result-' + i + '_");\'>' +
                '<a href="#"><img src=' + copy_icon_url + ' width="20"></a>' +
            '</div>' +
            '</td>' +
            '</tr>';
        }

        if(_classNames_.length > 1) {
        $("#_pendota_template-table_").html(appendedHTML);
        }  
    });
    };

    // A click event will "lock" the fields in their current state.  Clicking again will re-enable.
    window.onclick = function (e) {
    e.preventDefault();
    if(window.onmouseover != null) {
        document.getElementById('_pendota_status_').textContent = "Element Locked.  Click anywhere to reset.";
        window.onmouseover = null;
    } else {
        startMouseover();
    }
    };

    startMouseover();

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