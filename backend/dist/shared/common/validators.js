"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireNonEmptyString = requireNonEmptyString;
exports.requirePositiveInt = requirePositiveInt;
exports.assertChangeAddressAndAssetName = assertChangeAddressAndAssetName;
exports.assertMetadataOrRequiredFields = assertMetadataOrRequiredFields;
const common_1 = require("@nestjs/common");
function requireNonEmptyString(value, message) {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s)
        throw new common_1.BadRequestException(message);
    return s;
}
function requirePositiveInt(value, message) {
    const n = typeof value === "number" ? value : Number(String(value));
    if (!Number.isInteger(n) || n < 1)
        throw new common_1.BadRequestException(message);
    return n;
}
function assertChangeAddressAndAssetName(body) {
    requireNonEmptyString(body.changeAddress, "Missing changeAddress or assetName");
    requireNonEmptyString(body.assetName, "Missing changeAddress or assetName");
}
function assertMetadataOrRequiredFields(body) {
    const missingRequired = !requireMaybeString(body.name) ||
        !requireMaybeString(body.image) ||
        !(Array.isArray(body.receivers) && body.receivers.length) ||
        !requireMaybeString(body.receiverLocations) ||
        !requireMaybeString(body.receiverCoordinates) ||
        !requireMaybeString(body.minterLocation) ||
        !requireMaybeString(body.minterCoordinates);
    if (!body.metadata && missingRequired) {
        throw new common_1.BadRequestException("Missing metadata or (name, image, receivers, receiverLocations, receiverCoordinates, minterLocation, minterCoordinates)");
    }
}
function requireMaybeString(value) {
    return typeof value === "string" ? value.trim() : "";
}
//# sourceMappingURL=validators.js.map