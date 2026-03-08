"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ref100MetadataService = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const cardano_service_1 = require("./cardano.service");
const utils_1 = require("../../shared/common/utils");
const utils_2 = require("./cip68/utils");
function decodeHexToUtf8(value) {
    if (value == null)
        return "";
    const s = String(value).trim();
    if (!s)
        return "";
    let hex = s;
    if (hex.startsWith("0x") || hex.startsWith("0X"))
        hex = hex.slice(2);
    if (!/^[0-9a-fA-F]*$/.test(hex))
        return s;
    try {
        return Buffer.from(hex, "hex").toString("utf8");
    }
    catch (_a) {
        return s;
    }
}
let Ref100MetadataService = class Ref100MetadataService {
    constructor(config, cardano) {
        this.config = config;
        this.cardano = cardano;
    }
    async getMetadata(policyId, assetName) {
        var _a, _b, _c, _d, _e;
        const pid = policyId === null || policyId === void 0 ? void 0 : policyId.trim();
        const name = assetName === null || assetName === void 0 ? void 0 : assetName.trim();
        if (!pid || !name)
            return null;
        const ref100Unit = (0, utils_1.buildRef100Unit)(pid, name, this.config.cip68Prefix);
        let quantity = "0";
        try {
            const asset = (await this.cardano.blockfrostFetcher.fetchSpecificAsset(ref100Unit));
            quantity = (_a = asset === null || asset === void 0 ? void 0 : asset.quantity) !== null && _a !== void 0 ? _a : "0";
        }
        catch (_f) {
            return null;
        }
        if (quantity === "0")
            return null;
        const holders = await this.cardano.blockfrostFetcher.fetchAssetAddresses(ref100Unit);
        const holderAddress = holders.length > 0 ? (_b = holders[0].address) === null || _b === void 0 ? void 0 : _b.trim() : null;
        if (!holderAddress)
            return null;
        const utxosRaw = await this.cardano.blockfrostFetcher.fetchAddressUTXOsAsset(holderAddress, ref100Unit);
        const utxosList = Array.isArray(utxosRaw) ? utxosRaw : [];
        const firstUtxo = utxosList[0];
        let datumHex = (_c = firstUtxo === null || firstUtxo === void 0 ? void 0 : firstUtxo.inline_datum) !== null && _c !== void 0 ? _c : null;
        if (!datumHex && (firstUtxo === null || firstUtxo === void 0 ? void 0 : firstUtxo.tx_hash) != null && (firstUtxo === null || firstUtxo === void 0 ? void 0 : firstUtxo.output_index) != null) {
            const tx = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(firstUtxo.tx_hash);
            const outputs = (_d = tx === null || tx === void 0 ? void 0 : tx.outputs) !== null && _d !== void 0 ? _d : [];
            const out = outputs.find((o) => Number(o.output_index) === Number(firstUtxo === null || firstUtxo === void 0 ? void 0 : firstUtxo.output_index));
            datumHex = (_e = out === null || out === void 0 ? void 0 : out.inline_datum) !== null && _e !== void 0 ? _e : null;
        }
        if (!datumHex)
            return null;
        const metaRaw = await (0, utils_2.datumToJson)(datumHex, { contain_pk: true });
        const meta = typeof metaRaw === "object" && metaRaw !== null
            ? metaRaw
            : {};
        const receiverAddressesStr = decodeHexToUtf8(meta.receiver_addresses) ||
            meta.receiver_addresses ||
            "";
        const receiverAddresses = receiverAddressesStr
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean);
        const minterAddress = decodeHexToUtf8(meta.minter_address) || meta.minter_address || null;
        const receiverLocations = decodeHexToUtf8(meta.receiver_locations) || meta.receiver_locations || undefined;
        const receiverCoordinates = decodeHexToUtf8(meta.receiver_coordinates) || meta.receiver_coordinates || undefined;
        return {
            minterAddress: minterAddress || null,
            receiverAddresses,
            receiverLocations: receiverLocations || undefined,
            receiverCoordinates: receiverCoordinates || undefined,
        };
    }
    async getMetadataOrThrow(policyId, assetName) {
        const result = await this.getMetadata(policyId.trim(), assetName.trim());
        if (!result) {
            throw new common_1.NotFoundException("Ref100 metadata not found for this policy and asset. Asset may not exist or be revoked.");
        }
        return result;
    }
};
exports.Ref100MetadataService = Ref100MetadataService;
exports.Ref100MetadataService = Ref100MetadataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        cardano_service_1.CardanoService])
], Ref100MetadataService);
//# sourceMappingURL=ref100-metadata.service.js.map