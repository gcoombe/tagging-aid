//Invoke the Mouseover event immediately
var _id_ = "";
var _classNames_ = [];
var copy_icon_url = chrome.extension.getURL('/src/ui/images/copy_icon.ico');

function startMouseover(){
  document.getElementById('status').textContent = "Ready to inspect!";
  
  window.onmouseover=(function(e) {
    _id_ = e.target.id;
    _classNames_ = e.target.className.split(" ");

    var appendedHTML = "";

    $('#id-result').val("#" + _id_);
    $('#class-result-0').val("." + _classNames_[0]);
    $("#template-table").empty();
    
    for (i=1; i < _classNames_.length; i++) {
      appendedHTML = appendedHTML +
      '<tr>' +
        '<td width="90%" class="input-row"><input class="form-control class-result" type="text" id="class-result-' + i + '" value=".' + _classNames_[i] + '" readonly></td>' +
        '<td width="2%" class="input-row">&nbsp;</td>' +
        '<td width="8%" class="input-row">' +
          '<div onclick=\'copyToClipboard("class-result-' + i + '", ".");\'>' +
            '<a href="#"><img src="' + copy_icon_url + '" width="20"></a>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }

    if(_classNames_.length > 1) {
      $("#template-table").html(appendedHTML);
    }  
  });
};

window.onclick = function (e) {
  if(window.onmouseover != null) {
    document.getElementById('status').textContent = "Element Locked.  Click anywhere to reset.";
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