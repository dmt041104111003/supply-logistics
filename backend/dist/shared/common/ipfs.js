"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanIpfsHash = cleanIpfsHash;
function cleanIpfsHash(raw) {
    return (raw || "").trim().replace(/^ipfs:\/\//, "");
}
//# sourceMappingURL=ipfs.js.map