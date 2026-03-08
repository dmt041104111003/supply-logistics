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
exports.TraceAssetUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../../../core/config/config.service");
const cardano_service_1 = require("../../../core/cardano/cardano.service");
const order_service_1 = require("../../../order/order.service");
const utils_1 = require("../../../shared/common/utils");
const utils_2 = require("../../../core/cardano/cip68/utils");
const utils_3 = require("../../utils");
let TraceAssetUseCase = class TraceAssetUseCase {
    constructor(config, cardano, order) {
        this.config = config;
        this.cardano = cardano;
        this.order = order;
    }
    async execute(policyId, assetName, atTxHash) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
        const policyIdTrimmed = policyId.trim();
        const assetNameTrimmed = assetName.trim();
        const isSnapshot = !!(atTxHash === null || atTxHash === void 0 ? void 0 : atTxHash.trim());
        const ref100Unit = (0, utils_1.buildRef100Unit)(policyIdTrimmed, assetNameTrimmed, this.config.cip68Prefix);
        let ref100Quantity = "0";
        try {
            const ref100Asset = (await this.cardano.blockfrostFetcher.fetchSpecificAsset(ref100Unit));
            ref100Quantity = (_a = ref100Asset === null || ref100Asset === void 0 ? void 0 : ref100Asset.quantity) !== null && _a !== void 0 ? _a : "0";
        }
        catch (_4) {
            throw new common_1.NotFoundException("Asset not found on chain for this policyId and assetName.");
        }
        if (ref100Quantity === "0") {
            const coreRevoked = {
                policyId: policyIdTrimmed,
                assetName: assetNameTrimmed,
                standard: "Traceability-v1",
                referenceUtxo: null,
                batch: {
                    name: "",
                    description: null,
                    image: null,
                    originSiteCode: null,
                    minterName: null,
                    minterLocation: null,
                },
            };
            return {
                metadata: {},
                properties: {},
                certificateUrl: null,
                lifecycle: { completed: false, checkpointsPassed: [], missingCheckpoints: [] },
                burnStatus: "revoked",
                revoked: true,
                mapData: undefined,
                currentLocation: undefined,
                display: undefined,
                core: coreRevoked,
                route: undefined,
                shipping: undefined,
                inventory: undefined,
            };
        }
        let datumHex = null;
        let ref100Utxo;
        if (isSnapshot) {
            const txHashTrim = atTxHash.trim();
            const tx = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(txHashTrim);
            const outputs = (_b = tx === null || tx === void 0 ? void 0 : tx.outputs) !== null && _b !== void 0 ? _b : [];
            const outWithRef100 = outputs.find((o) => Array.isArray(o === null || o === void 0 ? void 0 : o.amount) &&
                o.amount.some((a) => a.unit === ref100Unit));
            if (!(outWithRef100 === null || outWithRef100 === void 0 ? void 0 : outWithRef100.inline_datum)) {
                throw new common_1.NotFoundException("Ref100 datum not found in the specified transaction.");
            }
            datumHex = outWithRef100.inline_datum;
            ref100Utxo = undefined;
        }
        else {
            const holdersRef100 = await this.cardano.blockfrostFetcher.fetchAssetAddresses(ref100Unit);
            const storeAddress = holdersRef100.length > 0 ? (_c = holdersRef100[0].address) === null || _c === void 0 ? void 0 : _c.trim() : null;
            if (!storeAddress) {
                throw new common_1.NotFoundException("Ref100 UTxO not found on chain.");
            }
            const utxosRaw = await this.cardano.blockfrostFetcher.fetchAddressUTXOsAsset(storeAddress, ref100Unit);
            const utxosList = Array.isArray(utxosRaw) ? utxosRaw : [];
            ref100Utxo = utxosList[0];
            if (ref100Utxo === null || ref100Utxo === void 0 ? void 0 : ref100Utxo.inline_datum) {
                datumHex = ref100Utxo.inline_datum;
            }
            else if ((ref100Utxo === null || ref100Utxo === void 0 ? void 0 : ref100Utxo.tx_hash) != null &&
                (ref100Utxo === null || ref100Utxo === void 0 ? void 0 : ref100Utxo.output_index) != null) {
                const tx = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(ref100Utxo.tx_hash);
                const outputs = (_d = tx === null || tx === void 0 ? void 0 : tx.outputs) !== null && _d !== void 0 ? _d : [];
                const out = outputs.find((o) => Number(o.output_index) === Number(ref100Utxo === null || ref100Utxo === void 0 ? void 0 : ref100Utxo.output_index));
                datumHex = (_e = out === null || out === void 0 ? void 0 : out.inline_datum) !== null && _e !== void 0 ? _e : null;
            }
        }
        if (!datumHex) {
            throw new common_1.NotFoundException("Ref100 datum not found on chain.");
        }
        const metaRaw = await (0, utils_2.datumToJson)(datumHex, { contain_pk: true });
        const metadataRecord = (typeof metaRaw === "object" && metaRaw !== null ? metaRaw : {});
        const metadata = Object.assign({}, metadataRecord);
        const rawReceiverLocations = (0, utils_3.decodeHexToUtf8)(metadataRecord.receiver_locations) ||
            metadataRecord.receiver_locations ||
            "";
        const rawMinterLocation = (0, utils_3.decodeHexToUtf8)(metadataRecord.minter_location) ||
            metadataRecord.minter_location ||
            "Origin";
        const receiverLocationsArr = rawReceiverLocations
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
        const standard = metadataRecord.standard || "Traceability-v1";
        const properties = {};
        const rawExpiry = (_f = metadataRecord.ngayHetHan) !== null && _f !== void 0 ? _f : metadata.ngayHetHan;
        if (rawExpiry) {
            properties.ngayHetHan = rawExpiry;
        }
        const prefix222 = this.config.cip68Prefix.USER_222;
        const nft222Unit = (0, utils_3.buildNft222Unit)(policyIdTrimmed, assetNameTrimmed, prefix222);
        let nft222Quantity = "0";
        try {
            const nft222Asset = (await this.cardano.blockfrostFetcher.fetchSpecificAsset(nft222Unit));
            nft222Quantity = (_g = nft222Asset === null || nft222Asset === void 0 ? void 0 : nft222Asset.quantity) !== null && _g !== void 0 ? _g : "0";
        }
        catch (_5) {
            nft222Quantity = "0";
        }
        const burnStatus = nft222Quantity === "0" ? "burned" : "active";
        let burnedAtAddress = null;
        if (burnStatus === "burned") {
            try {
                const txList = (await this.cardano.blockfrostFetcher.fetchAssetTransactions(nft222Unit));
                if (Array.isArray(txList) && txList.length > 0) {
                    for (const { tx_hash } of txList) {
                        const txUtxos = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(tx_hash);
                        const inputs = (_h = txUtxos === null || txUtxos === void 0 ? void 0 : txUtxos.inputs) !== null && _h !== void 0 ? _h : [];
                        const inputWith222 = inputs.find((inp) => Array.isArray(inp.amount) &&
                            inp.amount.some((a) => a.unit === nft222Unit));
                        if (inputWith222 && inputWith222.address) {
                            burnedAtAddress = inputWith222.address.trim();
                            break;
                        }
                    }
                }
            }
            catch (_6) {
                burnedAtAddress = null;
            }
        }
        let scriptAddress = null;
        try {
            scriptAddress =
                (_k = (_j = this.order.getScriptAddress()) === null || _j === void 0 ? void 0 : _j.trim().toLowerCase()) !== null && _k !== void 0 ? _k : null;
        }
        catch (_7) {
            scriptAddress = null;
        }
        const referenceUtxo = !isSnapshot &&
            (ref100Utxo === null || ref100Utxo === void 0 ? void 0 : ref100Utxo.tx_hash) != null &&
            (ref100Utxo === null || ref100Utxo === void 0 ? void 0 : ref100Utxo.output_index) != null
            ? `${ref100Utxo.tx_hash}#${ref100Utxo.output_index}`
            : null;
        const core = {
            policyId: policyIdTrimmed,
            assetName: assetNameTrimmed,
            standard,
            referenceUtxo,
            batch: {
                name: (_l = metadataRecord.name) !== null && _l !== void 0 ? _l : "",
                description: (_m = metadataRecord.description) !== null && _m !== void 0 ? _m : null,
                image: (_o = metadataRecord.image) !== null && _o !== void 0 ? _o : null,
                originSiteCode: (_q = (_p = metadataRecord.originSiteCode) !== null && _p !== void 0 ? _p : rawMinterLocation) !== null && _q !== void 0 ? _q : null,
                minterName: null,
                minterLocation: rawMinterLocation !== null && rawMinterLocation !== void 0 ? rawMinterLocation : null,
            },
        };
        const certificateUrl = typeof metadataRecord.certificate === "string" && metadataRecord.certificate.trim()
            ? metadataRecord.certificate.trim()
            : null;
        const minterCoords = (_r = metadataRecord.minter_coordinates) !== null && _r !== void 0 ? _r : "";
        const receiverCoords = (_s = metadataRecord.receiver_coordinates) !== null && _s !== void 0 ? _s : "";
        const minterAddress = (0, utils_3.decodeHexToUtf8)(metadataRecord.minter_address) ||
            metadataRecord.minter_address ||
            null;
        const receiverAddressesStr = (0, utils_3.decodeHexToUtf8)(metadataRecord.receiver_addresses) ||
            metadataRecord.receiver_addresses ||
            "";
        const receiverAddressesArr = receiverAddressesStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const originPoints = (0, utils_3.parseCoordinates)(minterCoords);
        const originPoint = originPoints.length > 0 ? originPoints[0] : null;
        const receiverPoints = (0, utils_3.parseCoordinates)(receiverCoords);
        let currentLocation;
        if (!isSnapshot && burnStatus === "active") {
            try {
                const holders222 = await this.cardano.blockfrostFetcher.fetchAssetAddresses(nft222Unit);
                const holderAddress = holders222.length > 0 ? (_t = holders222[0].address) === null || _t === void 0 ? void 0 : _t.trim() : null;
                if (holderAddress) {
                    const holderLower = holderAddress.toLowerCase();
                    let label;
                    let lat = null;
                    let lng = null;
                    let locationType = "outside";
                    const minterLower = minterAddress === null || minterAddress === void 0 ? void 0 : minterAddress.trim().toLowerCase();
                    if (minterLower && holderLower === minterLower) {
                        label = "Origin (Minter)";
                        locationType = "minter";
                    }
                    else if (receiverAddressesArr.some((a) => (a === null || a === void 0 ? void 0 : a.trim().toLowerCase()) === holderLower)) {
                        const idx = receiverAddressesArr.findIndex((a) => (a === null || a === void 0 ? void 0 : a.trim().toLowerCase()) === holderLower);
                        label =
                            receiverLocationsArr[idx] != null
                                ? `Receiver: ${receiverLocationsArr[idx]}`
                                : `Receiver ${idx + 1}`;
                        locationType = "receiver";
                    }
                    else if (scriptAddress && holderLower === scriptAddress) {
                        label = "In transit (locked)";
                        locationType = "script";
                    }
                    else {
                        label = "Wallet";
                        locationType = "outside";
                    }
                    currentLocation = {
                        address: holderAddress,
                        label,
                        lat,
                        lng,
                        locationType,
                    };
                }
            }
            catch (_8) {
            }
        }
        const currentHolderIndex = (() => {
            if (isSnapshot || burnStatus !== "active" || !currentLocation)
                return null;
            const holderLower = currentLocation.address.trim().toLowerCase();
            if (!holderLower)
                return null;
            if (minterAddress && minterAddress.trim().toLowerCase() === holderLower)
                return 0;
            for (let i = 0; i < receiverAddressesArr.length; i++) {
                if (receiverAddressesArr[i] &&
                    receiverAddressesArr[i].trim().toLowerCase() === holderLower)
                    return i + 1;
            }
            return null;
        })();
        const addressToPointIndex = (addr) => {
            var _a;
            if (!addr)
                return null;
            const lower = addr.trim().toLowerCase();
            if (minterAddress && minterAddress.trim().toLowerCase() === lower)
                return 0;
            for (let i = 0; i < receiverAddressesArr.length; i++) {
                if (((_a = receiverAddressesArr[i]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === lower)
                    return i + 1;
            }
            return null;
        };
        const properlyReachedIndices = new Set();
        if (!isSnapshot && burnStatus === "active" && scriptAddress) {
            try {
                const allTxs = await this.cardano.blockfrostFetcher.fetchAllAssetTransactions(nft222Unit);
                const scriptLower = scriptAddress.toLowerCase();
                for (const { tx_hash } of Array.isArray(allTxs) ? allTxs : []) {
                    const txUtxos = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(tx_hash);
                    const inputs = (_u = txUtxos === null || txUtxos === void 0 ? void 0 : txUtxos.inputs) !== null && _u !== void 0 ? _u : [];
                    const outputs = (_v = txUtxos === null || txUtxos === void 0 ? void 0 : txUtxos.outputs) !== null && _v !== void 0 ? _v : [];
                    const inputWith222 = inputs.find((inp) => Array.isArray(inp.amount) &&
                        inp.amount.some((a) => a.unit === nft222Unit));
                    const outputWith222 = outputs.find((o) => Array.isArray(o === null || o === void 0 ? void 0 : o.amount) &&
                        o.amount.some((a) => a.unit === nft222Unit));
                    const fromAddress = (_x = (_w = inputWith222 === null || inputWith222 === void 0 ? void 0 : inputWith222.address) === null || _w === void 0 ? void 0 : _w.trim().toLowerCase()) !== null && _x !== void 0 ? _x : null;
                    const toAddress = (_z = (_y = outputWith222 === null || outputWith222 === void 0 ? void 0 : outputWith222.address) === null || _y === void 0 ? void 0 : _y.trim().toLowerCase()) !== null && _z !== void 0 ? _z : null;
                    if (!toAddress)
                        continue;
                    const toIndex = addressToPointIndex(toAddress);
                    if (fromAddress === null && toIndex === 0) {
                        properlyReachedIndices.add(0);
                    }
                    if (fromAddress === scriptLower && toIndex !== null) {
                        properlyReachedIndices.add(toIndex);
                    }
                }
            }
            catch (_9) {
            }
        }
        let lastInChainIndexFromHistory = null;
        if (!isSnapshot && burnStatus === "active" && (currentLocation === null || currentLocation === void 0 ? void 0 : currentLocation.address)) {
            try {
                const txList = (await this.cardano.blockfrostFetcher.fetchAssetTransactions(nft222Unit));
                const toAddressLower = currentLocation.address.trim().toLowerCase();
                for (const { tx_hash } of Array.isArray(txList) ? txList : []) {
                    const txUtxos = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(tx_hash);
                    const outputs = (_0 = txUtxos === null || txUtxos === void 0 ? void 0 : txUtxos.outputs) !== null && _0 !== void 0 ? _0 : [];
                    const outputToHolder = outputs.find((o) => {
                        var _a;
                        return ((_a = o.address) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === toAddressLower &&
                            Array.isArray(o.amount) &&
                            o.amount.some((a) => a.unit === nft222Unit);
                    });
                    if (!outputToHolder)
                        continue;
                    const inputs = (_1 = txUtxos === null || txUtxos === void 0 ? void 0 : txUtxos.inputs) !== null && _1 !== void 0 ? _1 : [];
                    const inputWith222 = inputs.find((inp) => Array.isArray(inp.amount) &&
                        inp.amount.some((a) => a.unit === nft222Unit));
                    if (inputWith222 === null || inputWith222 === void 0 ? void 0 : inputWith222.address) {
                        const senderIndex = addressToPointIndex(inputWith222.address);
                        if (senderIndex !== null)
                            lastInChainIndexFromHistory = senderIndex;
                        break;
                    }
                }
            }
            catch (_10) {
                lastInChainIndexFromHistory = null;
            }
        }
        const isInScript = (currentLocation === null || currentLocation === void 0 ? void 0 : currentLocation.locationType) === "script";
        const burnedAddressLower = (_2 = burnedAtAddress === null || burnedAtAddress === void 0 ? void 0 : burnedAtAddress.trim().toLowerCase()) !== null && _2 !== void 0 ? _2 : "";
        const inTransitFromIndex = isInScript ? (lastInChainIndexFromHistory !== null && lastInChainIndexFromHistory !== void 0 ? lastInChainIndexFromHistory : 0) : -1;
        const finalMapData = [];
        let pointIndex = 0;
        if (originPoint) {
            const isBurnHere = !!burnedAddressLower && (minterAddress === null || minterAddress === void 0 ? void 0 : minterAddress.trim().toLowerCase()) === burnedAddressLower;
            const status = burnStatus === "burned" && isBurnHere
                ? "burned"
                : isInScript
                    ? properlyReachedIndices.has(pointIndex)
                        ? "completed"
                        : pointIndex === inTransitFromIndex + 1
                            ? "in_transit"
                            : "pending"
                    : properlyReachedIndices.has(pointIndex)
                        ? "completed"
                        : currentHolderIndex === pointIndex
                            ? "current"
                            : "pending";
            finalMapData.push({
                lat: originPoint.lat,
                lng: originPoint.lng,
                label: rawMinterLocation || "Origin",
                status,
                pointType: isBurnHere ? "burned" : "origin",
                address: minterAddress !== null && minterAddress !== void 0 ? minterAddress : undefined,
            });
            pointIndex++;
        }
        receiverPoints.forEach((pt, i) => {
            var _a, _b, _c;
            const addr = (_a = receiverAddressesArr[i]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
            const isBurnHere = !!burnedAddressLower && addr === burnedAddressLower;
            const status = burnStatus === "burned" && isBurnHere
                ? "burned"
                : isInScript
                    ? properlyReachedIndices.has(pointIndex)
                        ? "completed"
                        : pointIndex === inTransitFromIndex + 1
                            ? "in_transit"
                            : "pending"
                    : properlyReachedIndices.has(pointIndex)
                        ? "completed"
                        : currentHolderIndex === pointIndex
                            ? "current"
                            : "pending";
            finalMapData.push({
                lat: pt.lat,
                lng: pt.lng,
                label: (_b = receiverLocationsArr[i]) !== null && _b !== void 0 ? _b : `Stop ${i + 1}`,
                status,
                pointType: isBurnHere ? "burned" : "receiver",
                address: (_c = receiverAddressesArr[i]) !== null && _c !== void 0 ? _c : undefined,
            });
            pointIndex++;
        });
        const display = (0, utils_3.buildDisplay)(metadata, properties, rawMinterLocation, receiverLocationsArr, (_3 = metadataRecord.image) !== null && _3 !== void 0 ? _3 : null);
        return {
            metadata,
            properties,
            certificateUrl: certificateUrl !== null && certificateUrl !== void 0 ? certificateUrl : null,
            lifecycle: {
                completed: false,
                checkpointsPassed: [],
                missingCheckpoints: [],
            },
            burnStatus,
            burnedAtAddress: burnedAtAddress !== null && burnedAtAddress !== void 0 ? burnedAtAddress : undefined,
            mapData: finalMapData.length > 0 ? finalMapData : undefined,
            currentLocation: isSnapshot ? undefined : currentLocation,
            display,
            core,
            route: undefined,
            shipping: undefined,
            inventory: undefined,
            snapshotAtTxHash: isSnapshot ? atTxHash.trim() : undefined,
        };
    }
};
exports.TraceAssetUseCase = TraceAssetUseCase;
exports.TraceAssetUseCase = TraceAssetUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        cardano_service_1.CardanoService,
        order_service_1.OrderService])
], TraceAssetUseCase);
//# sourceMappingURL=trace-asset.use-case.js.map