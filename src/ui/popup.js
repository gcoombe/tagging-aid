var activeTab;
var pendotaPopupId = "pendota-popup-wrapper";
var btnDesId = "btnDesignerToggle";
var btnTAId = "btnTaggingAidToggle";

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	// since only one tab should be active and in the current window at once
	// the return variable should only have one entry
	activeTab = tabs[0];
	console.log("url: ", activeTab.url);
	if (activeTab.url.startsWith("chrome://")) {
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
				if (!!request.designerEnabled) {
					document.getElementById(
						pendotaPopupId
					).innerHTML = `Cannot activate tagging aid while the designer is open.`;
				} else {
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
                    });

                    chrome.tabs.executeScript({
                        file: "./src/scripts/interact.min.js",
                    });

                    chrome.tabs.executeScript({
                        file: "./src/scripts/feather.min.js",
                    });

                    // insert pendoTA definitions
                    chrome.tabs.executeScript({
                        file: "./src/scripts/insertDefinitions.js",
                    });

					var btnTA = document.createElement("button");
					btnTA.id = btnTAId;
					btnTA.classList.add("popup-button");
					btnTA.innerText = "Toggle Tagging Aid";
					btnTA.addEventListener("click", launchPendota);
					document.getElementById(pendotaPopupId).appendChild(btnTA);
				}
			}
		);

		// Triggers script that sends message about whether designer is open
		chrome.tabs.executeScript({
			file: "./src/scripts/preloadCheck.js",
        });

		function launchDesigner() {
			// launch the Pendo designer
			chrome.tabs.executeScript({
				file: "./src/scripts/launchDesigner.js",
			});

			// dismiss the extension popup
			window.close();
		}

		function launchPendota() {
			// toggle on/off the pendota UI
			chrome.tabs.executeScript({
				file: "./src/scripts/toggleUI.js",
			});

			// dismiss the extension popup
			window.close();
		}
	}
});
