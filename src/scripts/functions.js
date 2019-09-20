//Invoke the Mouseover event immediately
var _id_ = "";
var _classNames_ = [];
var copy_icon_url = chrome.extension.getURL('/src/ui/images/copy_icon.ico');

function startMouseover(){
  document.getElementById('_pendota_status_').textContent = "Ready to inspect!";
  
  window.onmouseover=(function(e) {
    _id_ = e.target.id;
    _classNames_ = e.target.className.split(" ");

    var appendedHTML = "";

    $('#_pendota_id-result').val("#" + _id_);
    $('#_pendota_class-result-0_').val("." + _classNames_[0]);
    $("#_pendota_template-table_").empty();
    
    for (i=1; i < _classNames_.length; i++) {
      appendedHTML = appendedHTML +
      '<tr>' +
        '<td width="90%" class="_pendota_input-row_"><input class="_pendota_form-control_ _pendota_class-result_" type="text" id="_pendota_class-result-' + i + '_" value=".' + _classNames_[i] + '" readonly></td>' +
        '<td width="2%" class="_pendota_input-row_">&nbsp;</td>' +
        '<td width="8%" class="_pendota_input-row_">' +
          '<div onclick=\'copyToClipboard("_pendota_class-result-' + i + '_", ".");\'>' +
            '<a href="#"><img src="' + copy_icon_url + '" width="20"></a>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }

    if(_classNames_.length > 1) {
      $("#_pendota_template-table_").html(appendedHTML);
    }  
  });
};

window.onclick = function (e) {
  if(window.onmouseover != null) {
    document.getElementById('_pendota_status_').textContent = "Element Locked.  Click anywhere to reset.";
    window.onmouseover = null;
  } else {
    startMouseover();
  }
};

$('#_pendo-copy-icon_').attr('src', copy_icon_url);
console.log("This did execute");
startMouseover();


function copyToClipboard(inputId, inputType) {
  /* Get the text field */
  var copyText = document.getElementById(inputId);

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /*For mobile devices*/

  /* Copy the text inside the text field */
  document.execCommand("copy");
}