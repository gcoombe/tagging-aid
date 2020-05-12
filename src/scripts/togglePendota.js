// Check if base pendota is active
if (typeof pendotaIsActive == "undefined" || !pendotaIsActive) {
	_pendotaActivate_();
} else {
	_pendotaDeactivate_();
}