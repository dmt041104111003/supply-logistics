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
exports.TraceHistoryUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../../../core/config/config.service");
const cardano_service_1 = require("../../../core/cardano/cardano.service");
const utils_1 = require("../../../shared/common/utils");
let TraceHistoryUseCase = class TraceHistoryUseCase {
    constructor(config, cardano) {
        this.config = config;
        this.cardano = cardano;
    }
    async execute(policyId, assetName) {
        const policyIdTrimmed = policyId.trim();
        const assetNameTrimmed = assetName.trim();
        const ref100Unit = (0, utils_1.buildRef100Unit)(policyIdTrimmed, assetNameTrimmed, this.config.cip68Prefix);
        let txs;
        try {
            txs = await this.cardano.blockfrostFetcher.fetchAllAssetTransactionsWithBlockTime(ref100Unit);
        }
        catch (_a) {
            throw new common_1.NotFoundException("Asset not found on chain for this policyId and assetName.");
        }
        if (!Array.isArray(txs) || txs.length === 0) {
            return { items: [] };
        }
        const items = txs.map((tx, index) => {
            var _a, _b;
            const action = index === 0 ? "MINT" : "UPDATE";
            const blockTime = tx.block_time;
            const createdAt = typeof blockTime === "number" && blockTime > 0
                ? new Date(blockTime * 1000).toISOString()
                : "";
            return {
                txHash: (_b = (_a = tx.tx_hash) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "",
                action,
                createdAt,
            };
        });
        return { items };
    }
};
exports.TraceHistoryUseCase = TraceHistoryUseCase;
exports.TraceHistoryUseCase = TraceHistoryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        cardano_service_1.CardanoService])
], TraceHistoryUseCase);
//# sourceMappingURL=trace-history.use-case.js.map