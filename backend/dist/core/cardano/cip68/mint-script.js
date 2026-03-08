"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMintScriptCborForMinterAddress = computeMintScriptCborForMinterAddress;
const core_1 = require("@meshsdk/core");
const config_service_1 = require("../../config/config.service");
function computeMintScriptCborForMinterAddress(minterChangeAddress) {
    const config = new config_service_1.ConfigService();
    const plutus = config.getPlutus();
    const networkId = config.appNetworkId;
    const t = config.validatorTitle;
    const addr = (0, core_1.deserializeAddress)(minterChangeAddress);
    const pubKeyIssuer = addr.pubKeyHash;
    const stakeCredentialHash = addr.stakeCredentialHash;
    if (!pubKeyIssuer || !stakeCredentialHash) {
        throw new Error("Invalid minterChangeAddress: missing payment or stake credential hash.");
    }
    const readValidator = (title) => {
        const v = plutus.validators.find((vv) => vv.title === title);
        if (!v)
            throw new Error(`${title} validator not found.`);
        return v.compiledCode;
    };
    const storeCompileCode = readValidator(t.store);
    const ownerAddress = (0, core_1.mPubKeyAddress)(pubKeyIssuer, stakeCredentialHash);
    const storeScriptCbor = (0, core_1.applyParamsToScript)(storeCompileCode, [[ownerAddress]], "Mesh");
    const storeScript = { code: storeScriptCbor, version: "V3" };
    const storeScriptAddress = (0, core_1.serializePlutusScript)(storeScript, undefined, networkId, false).address;
    const storeScriptHash = (0, core_1.deserializeAddress)(storeScriptAddress).scriptHash;
    const storeAddressForMint = (0, core_1.mPubKeyAddress)(storeScriptHash, stakeCredentialHash);
    const mintCompileCode = readValidator(t.mint);
    const mintScriptCbor = (0, core_1.applyParamsToScript)(mintCompileCode, [[ownerAddress], storeAddressForMint], "Mesh");
    const policyId = (0, core_1.resolveScriptHash)(mintScriptCbor, "V3");
    return { mintScriptCbor, policyId };
}
//# sourceMappingURL=mint-script.js.map