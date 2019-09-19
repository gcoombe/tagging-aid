//Injects the tag assistant UI
console.log("Tag Assistant preparing...");

//Appends necessary stylesheets
$('head').append('<link href=' + chrome.extension.getURL('src/css/bootstrap.min.css') + ' rel="stylesheet">');
$('head').append('<link href=' + chrome.extension.getURL('src/css/custom.css') + ' rel="stylesheet">');

// Append timeline
$.get(chrome.extension.getURL('src/ui/popup.html'), function (data) {
    $("body").append(data);
});