// Check if base pendota is active
if (typeof pendota.pendotaIsActive == "undefined" || !pendota.pendotaIsActive) {
	pendota._pendotaActivate_();
} else {
	pendota.signalDeactivate();
}