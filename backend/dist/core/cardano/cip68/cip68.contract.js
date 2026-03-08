"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cip68Contract = void 0;
const core_1 = require("@meshsdk/core");
const lodash_1 = require("lodash");
const mesh_adapter_1 = require("./mesh.adapter");
const config_service_1 = require("../../config/config.service");
const utils_1 = require("./utils");
const CIP68_222 = (tokenNameHex) => `000de140${tokenNameHex}`;
class Cip68Contract extends mesh_adapter_1.MeshAdapter {
    constructor(opts = {}) {
        super(opts);
        this.mint = async (params) => {
            const { utxos, walletAddress, collateral } = await this.getWalletForTx();
            const unsignedTx = this.meshTxBuilder.mintPlutusScriptV3();
            const txOutReceiverMap = new Map();
            await Promise.all(params.map(async ({ assetName, metadata, quantity = "1", receiver = "", }) => {
                var _a;
                if (quantity !== "1") {
                    throw new Error("CIP-68 label 222 requires quantity = 1");
                }
                const existUtXOwithUnit = await this.getAddressUTXOAsset(this.storeAddress, this.policyId + (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)));
                if ((_a = existUtXOwithUnit === null || existUtXOwithUnit === void 0 ? void 0 : existUtXOwithUnit.output) === null || _a === void 0 ? void 0 : _a.plutusData) {
                    throw new Error(`Asset name "${assetName}" already minted. Each QR must use a unique asset name (e.g. add suffix: ${assetName}-001, ${assetName}-002).`);
                }
                else {
                    const receiverKey = !(0, lodash_1.isEmpty)(receiver) ? receiver : walletAddress;
                    if (txOutReceiverMap.has(receiverKey)) {
                        txOutReceiverMap.get(receiverKey).push({
                            unit: this.policyId + CIP68_222((0, core_1.stringToHex)(assetName)),
                            quantity: quantity,
                        });
                    }
                    else {
                        txOutReceiverMap.set(receiverKey, [
                            {
                                unit: this.policyId + CIP68_222((0, core_1.stringToHex)(assetName)),
                                quantity: quantity,
                            },
                        ]);
                    }
                    unsignedTx
                        .mintPlutusScriptV3()
                        .mint(quantity, this.policyId, CIP68_222((0, core_1.stringToHex)(assetName)))
                        .mintingScript(this.mintScriptCbor)
                        .mintRedeemerValue((0, core_1.mConStr0)([]))
                        .mintPlutusScriptV3()
                        .mint("1", this.policyId, (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)))
                        .mintingScript(this.mintScriptCbor)
                        .mintRedeemerValue((0, core_1.mConStr0)([]))
                        .txOut(this.storeAddress, [
                        {
                            unit: this.policyId + (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)),
                            quantity: "1",
                        },
                    ])
                        .txOutInlineDatumValue((0, core_1.metadataToCip68)((0, utils_1.metadataForDatum)(metadata)));
                }
            }));
            txOutReceiverMap.forEach((assets, receiver) => {
                unsignedTx.txOut(receiver, assets);
            });
            unsignedTx
                .changeAddress(walletAddress)
                .requiredSignerHash((0, core_1.deserializeAddress)(walletAddress).pubKeyHash)
                .selectUtxosFrom(utxos, "largestFirst", "7500000", true)
                .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
                .setNetwork(this.appNetwork);
            return await unsignedTx.complete();
        };
        this.burnRef100 = async (params) => {
            const { utxos, walletAddress, collateral } = await this.getWalletForTx();
            const unsignedTx = this.meshTxBuilder;
            for (const { assetName, txHash } of params) {
                const storeUtxo = !(0, lodash_1.isNil)(txHash)
                    ? await this.getUtxoForTx(this.storeAddress, txHash)
                    : await this.getAddressUTXOAsset(this.storeAddress, this.policyId + (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)));
                if (!storeUtxo)
                    throw new Error(`Store UTXO not found for ${assetName}`);
                unsignedTx
                    .spendingPlutusScriptV3()
                    .txIn(storeUtxo.input.txHash, storeUtxo.input.outputIndex)
                    .txInInlineDatumPresent()
                    .txInRedeemerValue((0, core_1.mConStr1)([]))
                    .txInScript(this.storeScriptCbor)
                    .mintPlutusScriptV3()
                    .mint("-1", this.policyId, (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)))
                    .mintRedeemerValue((0, core_1.mConStr1)([]))
                    .mintingScript(this.mintScriptCbor);
            }
            unsignedTx
                .requiredSignerHash((0, core_1.deserializeAddress)(walletAddress).pubKeyHash)
                .changeAddress(walletAddress)
                .selectUtxosFrom(utxos, "largestFirst", "7500000", true)
                .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
                .setNetwork(this.appNetwork);
            return await unsignedTx.complete();
        };
        this.revoke = async (params) => {
            return this.burnRef100(params);
        };
        this.burn222 = async (params) => {
            const { utxos, walletAddress, collateral } = await this.getWalletForTx();
            const unsignedTx = this.meshTxBuilder;
            await Promise.all(params.map(async ({ assetName, quantity, txHash, policyId }) => {
                var _a, _b, _c, _d, _e, _f, _g;
                const q = Number(quantity);
                if (!Number.isFinite(q) || Math.abs(q) !== 1) {
                    throw new Error("CIP-68 label 222 burn requires quantity = -1");
                }
                const rftSuffix = CIP68_222((0, core_1.stringToHex)(assetName));
                const policyFromKnownUtxos = (_b = (_a = (utxos !== null && utxos !== void 0 ? utxos : [])
                    .flatMap((u) => { var _a, _b; return (_b = (_a = u === null || u === void 0 ? void 0 : u.output) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : []; })
                    .map((a) => (typeof (a === null || a === void 0 ? void 0 : a.unit) === "string" ? a.unit : ""))
                    .find((unit) => unit.endsWith(rftSuffix) && unit.length >= 56 + rftSuffix.length)) === null || _a === void 0 ? void 0 : _a.slice(0, 56)) !== null && _b !== void 0 ? _b : undefined;
                const policyIdToUse = (_d = (_c = policyId !== null && policyId !== void 0 ? policyId : policyFromKnownUtxos) !== null && _c !== void 0 ? _c : (await this.getPolicyIdFromWalletRft(walletAddress, rftSuffix))) !== null && _d !== void 0 ? _d : this.policyId;
                if (policyIdToUse !== this.policyId &&
                    !this.minterMintScriptCbor) {
                    throw new Error([
                        `This NFT was minted under policy ${policyIdToUse}, but your connected wallet corresponds to policy ${this.policyId}.`,
                        `Only the issuer (minting) wallet can build a burn transaction for this policy in the current on-chain script.`,
                    ].join(" "));
                }
                const rftUnit = policyIdToUse + rftSuffix;
                const userUtxos = (utxos || []).filter((u) => { var _a, _b; return (_b = (_a = u === null || u === void 0 ? void 0 : u.output) === null || _a === void 0 ? void 0 : _a.amount) === null || _b === void 0 ? void 0 : _b.some((a) => a.unit === rftUnit); });
                const safeQty = (qv) => {
                    if (typeof qv === "number")
                        return Number.isFinite(qv) ? qv : 0;
                    if (typeof qv === "string") {
                        const n = Number(qv);
                        return Number.isFinite(n) ? n : 0;
                    }
                    return 0;
                };
                const amount = userUtxos.reduce((sum, u) => {
                    var _a, _b;
                    const inUtxo = ((_b = (_a = u.output) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : []).reduce((amt, a) => a.unit === rftUnit ? amt + safeQty(a.quantity) : amt, 0);
                    return sum + inUtxo;
                }, 0);
                if (!(amount >= 1)) {
                    throw new Error(`Wallet does not hold CIP-68 label 222 token for "${assetName}" (unit ${rftUnit}).`);
                }
                const ref100Unit = policyIdToUse + (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName));
                const storeUtxo = !(0, lodash_1.isNil)(txHash)
                    ? await this.getUtxoForTx(this.storeAddress, txHash)
                    : await this.getUtxoContainingUnit(ref100Unit);
                if (!storeUtxo)
                    throw new Error("Store UTXO not found");
                const datum = (_e = storeUtxo.output) === null || _e === void 0 ? void 0 : _e.plutusData;
                if (datum) {
                    const meta = (await (0, utils_1.datumToJson)(datum, {
                        contain_pk: true,
                    }));
                    const minterPk = (_g = (_f = meta._pk) !== null && _f !== void 0 ? _f : (await (0, utils_1.getPkHash)(datum))) !== null && _g !== void 0 ? _g : "";
                    const walletPk = (0, core_1.deserializeAddress)(walletAddress).pubKeyHash;
                    const receivers = (0, utils_1.decodeReceivers)(meta.receivers);
                    const inChain = walletPk === minterPk ||
                        receivers.some((r) => r.pubKeyHash === walletPk);
                    if (!inChain) {
                        throw new Error("Wallet not in chain (address not in metadata.receivers). Burn rejected by validator.");
                    }
                }
                const mintScriptCborToUse = policyIdToUse !== this.policyId && this.minterMintScriptCbor
                    ? this.minterMintScriptCbor
                    : this.mintScriptCbor;
                const burnQuantity = q > 0 ? -q : q;
                const burnQuantityStr = String(burnQuantity);
                for (const u of userUtxos) {
                    unsignedTx.txIn(u.input.txHash, u.input.outputIndex);
                }
                unsignedTx
                    .mintPlutusScriptV3()
                    .mint(burnQuantityStr, policyIdToUse, CIP68_222((0, core_1.stringToHex)(assetName)))
                    .mintRedeemerValue((0, core_1.mConStr1)([]))
                    .mintingScript(mintScriptCborToUse);
            }));
            unsignedTx
                .requiredSignerHash((0, core_1.deserializeAddress)(walletAddress).pubKeyHash)
                .changeAddress(walletAddress)
                .selectUtxosFrom(utxos, "largestFirst", "7500000", true)
                .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
                .setNetwork(this.appNetwork);
            return await unsignedTx.complete();
        };
        this.burn = async (params) => {
            return this.burn222(params);
        };
        this.update = async (params) => {
            const { utxos, walletAddress, collateral } = await this.getWalletForTx();
            const unsignedTx = this.meshTxBuilder;
            await Promise.all(params.map(async ({ assetName, metadata, txHash }) => {
                const storeUtxo = !(0, lodash_1.isNil)(txHash)
                    ? await this.getUtxoForTx(this.storeAddress, txHash)
                    : await this.getAddressUTXOAsset(this.storeAddress, this.policyId + (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)));
                if (!storeUtxo)
                    throw new Error("Store UTXO not found");
                unsignedTx
                    .spendingPlutusScriptV3()
                    .txIn(storeUtxo.input.txHash, storeUtxo.input.outputIndex)
                    .txInInlineDatumPresent()
                    .txInRedeemerValue((0, core_1.mConStr0)([]))
                    .txInScript(this.storeScriptCbor)
                    .txOut(this.storeAddress, [
                    {
                        unit: this.policyId + (0, core_1.CIP68_100)((0, core_1.stringToHex)(assetName)),
                        quantity: "1",
                    },
                ])
                    .txOutInlineDatumValue((0, core_1.metadataToCip68)((0, utils_1.metadataForDatum)(metadata)));
            }));
            unsignedTx
                .requiredSignerHash((0, core_1.deserializeAddress)(walletAddress).pubKeyHash)
                .changeAddress(walletAddress)
                .selectUtxosFrom(utxos, "largestFirst", "12000000", true)
                .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
                .setNetwork(this.appNetwork);
            return await unsignedTx.complete();
        };
    }
    get appNetwork() {
        return new config_service_1.ConfigService().appNetwork;
    }
}
exports.Cip68Contract = Cip68Contract;
//# sourceMappingURL=cip68.contract.js.map