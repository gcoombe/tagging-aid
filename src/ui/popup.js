var activeTab;
var pendotaPopupId = "pendota-popup-wrapper";
var btnDesId = "btnDesignerToggle";
var btnTAId = "btnTaggingAidToggle";
var lnTutId = "lnTutorialVideoLink";

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	// since only one tab should be active and in the current window at once
	// the return variable should only have one entry
	activeTab = tabs[0];
	console.log("url: ", activeTab.url);
	if (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("https://chrome.google.com/")) {
		document.getElementById(pendotaPopupId).innerHTML =
			"Cannot activate tagging aid on chrome pages.";
	} else {
		chrome.runtime.onMessage.addListener(
			// Display loading message until receive information about whether designer is open
			function (request, sender, sendResponse) {
				console.log(
					sender.tab
						? "from a content script:" + sender.tab.url
						: "from the extension"
				);
				console.log("message: ", request);
				if (request.hasOwnProperty("designerEnabled")) {
						document.getElementById(pendotaPopupId).innerHTML = "";
						if (!!request.pendoExists) {
							var btnDes = document.createElement("button");
							btnDes.id = btnDesId;
							btnDes.classList.add("popup-button");
							btnDes.innerText = "Launch Pendo Designer";
							btnDes.addEventListener("click", launchDesigner);
							document
								.getElementById(pendotaPopupId)
								.appendChild(btnDes);
						}
						// load dependency libraries
						chrome.tabs.executeScript({
							file: "./src/scripts/jquery.min.js",
							allFrames: true,
						});

						chrome.tabs.executeScript({
							file: "./src/scripts/lodash.min.js",
							allFrames: true,
						});

						chrome.tabs.executeScript({
							file: "./src/scripts/interact.min.js",
						});

						chrome.tabs.executeScript({
							file: "./src/scripts/feather.min.js",
						});

						// insert pendoTA definitions
						chrome.tabs.insertCSS({
							file: "./src/css/pendota_base.css",
							allFrames: true,
						});

						chrome.tabs.insertCSS({
							file: "./src/css/pendota_ui.css",
						});

						chrome.tabs.executeScript({
							file: "./src/scripts/insertBaseDefinitions.js",
							allFrames: true,
						});

						chrome.tabs.executeScript({
							file: "./src/scripts/insertUIDefinitions.js",
						});

						var btnTA = document.createElement("button");
						btnTA.id = btnTAId;
						btnTA.classList.add("popup-button");
						btnTA.innerText = "Toggle Tagging Aid";
						btnTA.addEventListener("click", launchPendota);
						document.getElementById(pendotaPopupId).appendChild(btnTA);

						var lnTut = document.createElement("a");
						lnTut.id = lnTutId;
						lnTut.innerText = "How to use this tool"
						lnTut.setAttribute("href", "https://example.com/");
						lnTut.setAttribute("target", "_blank");
						lnTut.classList.add("popup-link");
						document.getElementById(pendotaPopupId).appendChild(lnTut);
					}
				}
		);

		// Triggers script that sends message about whether designer is open
		chrome.tabs.executeScript({
			file: "./src/scripts/preloadCheck.js",
        });

		function launchDesigner() {
			// Deactivate tagging aid if running
			/* chrome.tabs.executeScript({
				file: "./src/scripts/deactivatePendota.js",
			}); */

			// launch the Pendo designer
			chrome.tabs.executeScript({
				file: "./src/scripts/launchDesigner.js",
			});

			// dismiss the extension popup
			window.close();
		}

		function launchPendota() {
			// toggle pendota on/off
			chrome.tabs.executeScript({
				file: "./src/scripts/togglePendota.js",
				allFrames: true,
			});

			// dismiss the extension popup
			window.close();
		}
	}
});
