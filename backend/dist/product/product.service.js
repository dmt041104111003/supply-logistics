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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const core_1 = require("@meshsdk/core");
const common_1 = require("@nestjs/common");
const cardano_service_1 = require("../core/cardano/cardano.service");
const ref100_metadata_service_1 = require("../core/cardano/ref100-metadata.service");
const config_service_1 = require("../core/config/config.service");
const warehouse_service_1 = require("../warehouse/warehouse.service");
const cip68_contract_1 = require("../core/cardano/cip68/cip68.contract");
const mint_script_1 = require("../core/cardano/cip68/mint-script");
const product_helpers_1 = require("./product.helpers");
const product_repository_1 = require("./domain/product.repository");
const list_batches_use_case_1 = require("./application/use-cases/list-batches.use-case");
const record_product_tx_use_case_1 = require("./application/use-cases/record-product-tx.use-case");
const utils_1 = require("../trace/utils");
let ProductService = class ProductService {
    constructor(cardano, config, warehouse, productRepository, listBatchesUseCase, recordProductTxUseCase, ref100Metadata) {
        this.cardano = cardano;
        this.config = config;
        this.warehouse = warehouse;
        this.productRepository = productRepository;
        this.listBatchesUseCase = listBatchesUseCase;
        this.recordProductTxUseCase = recordProductTxUseCase;
        this.ref100Metadata = ref100Metadata;
    }
    createContract(changeAddress, opts) {
        const wallet = (0, product_helpers_1.createReadOnlyWallet)(changeAddress, this.cardano.blockfrostProvider, opts === null || opts === void 0 ? void 0 : opts.walletUtxos, opts === null || opts === void 0 ? void 0 : opts.utxoAddresses);
        return new cip68_contract_1.Cip68Contract(Object.assign({ wallet: wallet }, ((opts === null || opts === void 0 ? void 0 : opts.minterMintScriptCbor) ? { minterMintScriptCbor: opts.minterMintScriptCbor } : {})));
    }
    async listBatches(profileId) {
        const items = await this.listBatchesUseCase.execute(profileId);
        const withCanUpdate = await Promise.all(items.map(async (item) => (Object.assign(Object.assign({}, item), { canUpdate: await this.getCanUpdate(item.batchId, item.policyId) }))));
        return withCanUpdate;
    }
    async getCanUpdate(batchId, policyId) {
        var _a;
        if (!(policyId === null || policyId === void 0 ? void 0 : policyId.trim()))
            return false;
        const minterAddr = await this.productRepository.getMinterWalletAddressByBatchCode(batchId);
        if (!(minterAddr === null || minterAddr === void 0 ? void 0 : minterAddr.trim()))
            return false;
        const prefix222 = this.config.cip68Prefix.USER_222;
        const nft222Unit = (0, utils_1.buildNft222Unit)(policyId.trim(), batchId.trim(), prefix222);
        try {
            const holders = await this.cardano.blockfrostFetcher.fetchAssetAddresses(nft222Unit);
            if (!Array.isArray(holders) || holders.length === 0)
                return false;
            const first = holders[0];
            const holderAddr = (_a = first === null || first === void 0 ? void 0 : first.address) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
            return holderAddr === minterAddr.trim().toLowerCase();
        }
        catch (_b) {
            return false;
        }
    }
    buildMetadataOrThrow(params) {
        var _a, _b;
        if (params.metadata) {
            const out = Object.assign({}, params.metadata);
            if ((_a = params.certificate) === null || _a === void 0 ? void 0 : _a.trim())
                out.certificate = params.certificate.trim();
            return out;
        }
        if (!params.name ||
            !params.image ||
            !((_b = params.receivers) === null || _b === void 0 ? void 0 : _b.length) ||
            !params.receiverLocations ||
            !params.receiverCoordinates ||
            !params.minterLocation ||
            !params.minterCoordinates) {
            throw new common_1.BadRequestException("Need metadata or all of (name, image, receivers, receiverLocations, receiverCoordinates, minterLocation, minterCoordinates)");
        }
        const addrObj = (0, core_1.deserializeAddress)(params.changeAddress);
        const receiversPk = params.receivers.map((addr) => (0, core_1.resolvePaymentKeyHash)(addr)).join(",");
        return (0, product_helpers_1.buildMetadata)({
            pk: addrObj.pubKeyHash,
            receivers: receiversPk,
            receiver_locations: params.receiverLocations,
            receiver_coordinates: params.receiverCoordinates,
            minter_location: params.minterLocation,
            minter_coordinates: params.minterCoordinates,
            name: params.name,
            image: params.image,
            properties: params.propertiesJson,
            standard: "Traceability-v1",
            minter_address: params.changeAddress,
            receiver_addresses: params.receivers.join(","),
            certificate: params.certificate,
        });
    }
    async listRoadmap(batchId) {
        var _a;
        const batch = await this.productRepository.findBatchByCode(batchId.trim());
        if (!((_a = batch === null || batch === void 0 ? void 0 : batch.policyId) === null || _a === void 0 ? void 0 : _a.trim()))
            return [];
        const meta = await this.ref100Metadata.getMetadata(batch.policyId.trim(), batchId.trim());
        if (!meta)
            return [];
        return meta.receiverAddresses.map((toAddress, stepIndex) => {
            var _a;
            return ({
                stepIndex,
                toAddress: (_a = toAddress === null || toAddress === void 0 ? void 0 : toAddress.trim()) !== null && _a !== void 0 ? _a : null,
            });
        });
    }
    async mint(params) {
        var _a, _b;
        const contract = this.createContract(params.changeAddress, {
            walletUtxos: params.walletUtxos,
            utxoAddresses: params.utxoAddresses,
        });
        const metadata = this.buildMetadataOrThrow(params);
        const receiver = params.metadata ? ((_a = params.receiver) !== null && _a !== void 0 ? _a : params.changeAddress) : params.changeAddress;
        const unsignedTx = await contract.mint([
            { assetName: params.assetName, metadata, quantity: "1", receiver },
        ]);
        const policyId = (_b = contract.policyId) !== null && _b !== void 0 ? _b : undefined;
        return { unsignedTx, policyId };
    }
    async update(params) {
        const contract = this.createContract(params.changeAddress, {
            walletUtxos: params.walletUtxos,
            utxoAddresses: params.utxoAddresses,
        });
        const metadata = this.buildMetadataOrThrow(params);
        const unsignedTx = await contract.update([
            { assetName: params.assetName, metadata, txHash: params.txHash },
        ]);
        return { unsignedTx };
    }
    async revoke(params) {
        const contract = this.createContract(params.changeAddress, {
            walletUtxos: params.walletUtxos,
            utxoAddresses: params.utxoAddresses,
        });
        const unsignedTx = await contract.burnRef100([
            { assetName: params.assetName, txHash: params.txHash },
        ]);
        return { unsignedTx };
    }
    async burn(params) {
        var _a, _b;
        let minterMintScriptCbor;
        if (params.policyId) {
            const minterAddr = await this.productRepository.getMinterWalletAddressByBatchCode(params.assetName);
            if (minterAddr) {
                try {
                    minterMintScriptCbor = (0, mint_script_1.computeMintScriptCborForMinterAddress)(minterAddr).mintScriptCbor;
                }
                catch (_c) {
                    minterMintScriptCbor = undefined;
                }
            }
        }
        const contract = this.createContract(params.changeAddress, {
            walletUtxos: params.walletUtxos,
            utxoAddresses: params.utxoAddresses,
            minterMintScriptCbor,
        });
        if ((_a = params.walletUtxos) === null || _a === void 0 ? void 0 : _a.length) {
            const policyIdToUse = (_b = params.policyId) !== null && _b !== void 0 ? _b : contract.policyId;
            if (policyIdToUse) {
                const nameHex = Buffer.from(params.assetName, "utf8").toString("hex");
                const unit = `${policyIdToUse}000de140${nameHex}`;
                const bal = params.walletUtxos.reduce((sum, u) => {
                    var _a, _b;
                    const amt = (_b = (_a = u === null || u === void 0 ? void 0 : u.output) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : [];
                    const inUtxo = Array.isArray(amt)
                        ? amt.reduce((s, a) => { var _a; return (a === null || a === void 0 ? void 0 : a.unit) === unit ? s + Number((_a = a.quantity) !== null && _a !== void 0 ? _a : 0) : s; }, 0)
                        : 0;
                    return sum + inUtxo;
                }, 0);
                if (bal < 1) {
                    throw new common_1.BadRequestException(`Wallet does not hold CIP-68 label 222 token for "${params.assetName}" (unit ${unit}).`);
                }
            }
        }
        const unsignedTx = await contract.burn222([
            {
                assetName: params.assetName,
                quantity: "1",
                txHash: params.txHash,
                policyId: params.policyId,
            },
        ]);
        return { unsignedTx };
    }
    async getBatchSummaryByCode(code) {
        const batch = await this.productRepository.findBatchByCode(code);
        if (!batch) {
            throw new common_1.BadRequestException(`Batch not found: ${code}`);
        }
        return {
            policyId: batch.policyId,
            assetName: batch.batchId,
            nftUnit: null,
        };
    }
    async getBatchQrPayload(code) {
        var _a, _b, _c;
        const batch = await this.productRepository.findBatchByCode(code);
        if (!batch) {
            throw new common_1.BadRequestException(`Batch not found: ${code}`);
        }
        const policyId = (_a = batch.policyId) === null || _a === void 0 ? void 0 : _a.trim();
        if (!policyId) {
            return {
                policyId: "",
                assetName: batch.batchId,
                minter: (_b = await this.productRepository.getMinterWalletAddressByBatchCode(code)) !== null && _b !== void 0 ? _b : null,
                owners: [],
            };
        }
        const meta = await this.ref100Metadata.getMetadata(policyId, code.trim());
        const owners = (_c = meta === null || meta === void 0 ? void 0 : meta.receiverAddresses) !== null && _c !== void 0 ? _c : [];
        const minter = await this.productRepository.getMinterWalletAddressByBatchCode(code);
        return {
            policyId,
            assetName: batch.batchId,
            minter: minter !== null && minter !== void 0 ? minter : null,
            owners,
        };
    }
    async recordTx(params) {
        return this.recordProductTxUseCase.execute(params);
    }
    async removeOneFromWarehouse(profileId, batchId) {
        return this.warehouse.removeOneFromWarehouse(profileId, batchId);
    }
    async addToWarehouse(profileId, batchId) {
        return this.warehouse.addToWarehouse(profileId, batchId);
    }
    async submitSignedTx(signedTxInput, fromBase64, deleteBatchOnSuccess) {
        var _a;
        const toCborBuffer = (input, isBase64) => {
            if (isBase64) {
                try {
                    return Buffer.from(input, "base64");
                }
                catch (_a) {
                    throw new common_1.BadRequestException("signedTxBase64 is invalid");
                }
            }
            const stripped = input.startsWith("0x") ? input.slice(2) : input.trim();
            let parsed = stripped;
            try {
                if (stripped.startsWith("{"))
                    parsed = JSON.parse(stripped);
            }
            catch (_b) {
                parsed = stripped;
            }
            const pickSignedField = (obj) => {
                var _a, _b, _c, _d, _e;
                return (_e = (_d = (_c = (_b = (_a = obj.signedTransaction) !== null && _a !== void 0 ? _a : obj.cborTx) !== null && _b !== void 0 ? _b : obj.cbor) !== null && _c !== void 0 ? _c : obj.tx) !== null && _d !== void 0 ? _d : obj.transaction) !== null && _e !== void 0 ? _e : stripped;
            };
            const raw = typeof parsed === "object" && parsed !== null
                ? pickSignedField(parsed)
                : stripped;
            const s = String(raw);
            const isHex = /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;
            if (isHex)
                return Buffer.from(s, "hex");
            try {
                return Buffer.from(s, "base64");
            }
            catch (_c) {
                throw new common_1.BadRequestException("signedTx must be hex or base64");
            }
        };
        const cborBuffer = toCborBuffer(signedTxInput, fromBase64);
        const first = cborBuffer[0];
        const isCborList = first >= 0x80 && first <= 0x9f;
        const isCborListLong = first === 0x98 && cborBuffer.length > 1;
        if (!isCborList && !isCborListLong) {
            throw new common_1.BadRequestException(`signedTx is not valid CBOR tx (first byte 0x${first.toString(16).padStart(2, "0")}, length ${cborBuffer.length}). Wallet may return a different format.`);
        }
        const txHash = await this.cardano.blockfrostFetcher.submitTx(cborBuffer);
        if ((_a = deleteBatchOnSuccess === null || deleteBatchOnSuccess === void 0 ? void 0 : deleteBatchOnSuccess.assetName) === null || _a === void 0 ? void 0 : _a.trim()) {
            try {
                await this.productRepository.deleteBatch(deleteBatchOnSuccess.assetName.trim());
            }
            catch (_b) {
            }
        }
        return { txHash };
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(product_repository_1.PRODUCT_REPOSITORY)),
    __metadata("design:paramtypes", [cardano_service_1.CardanoService,
        config_service_1.ConfigService,
        warehouse_service_1.WarehouseService, Object, list_batches_use_case_1.ListBatchesUseCase,
        record_product_tx_use_case_1.RecordProductTxUseCase,
        ref100_metadata_service_1.Ref100MetadataService])
], ProductService);
//# sourceMappingURL=product.service.js.map