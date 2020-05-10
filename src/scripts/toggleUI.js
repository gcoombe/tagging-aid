// Check if UI has already been loaded
if (typeof _pendota_isVisible_ == "undefined" || !_pendota_isVisible_) {
	_pendotaInsertUI_();
} else {
	_pendotaRemoveUI_();
}