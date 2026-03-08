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
exports.GetRecipientByRoadmapUseCase = void 0;
const common_1 = require("@nestjs/common");
const warehouse_repository_1 = require("../../domain/warehouse.repository");
const ref100_metadata_service_1 = require("../../../core/cardano/ref100-metadata.service");
const prisma_service_1 = require("../../../prisma/prisma.service");
let GetRecipientByRoadmapUseCase = class GetRecipientByRoadmapUseCase {
    constructor(repository, ref100Metadata, prisma) {
        this.repository = repository;
        this.ref100Metadata = ref100Metadata;
        this.prisma = prisma;
    }
    async execute(profileId, batchId) {
        var _a, _b, _c, _d, _e, _f, _g;
        const bid = (batchId || "").trim();
        if (!bid)
            return { recipientAddress: null };
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
            select: { walletAddress: true },
        });
        if (!(profile === null || profile === void 0 ? void 0 : profile.walletAddress))
            return { recipientAddress: null };
        const senderWallet = profile.walletAddress.trim().toLowerCase();
        const batch = await this.prisma.productBatch.findUnique({
            where: { batchId: bid },
            select: {
                policyId: true,
                minterProfile: { select: { walletAddress: true } },
            },
        });
        if (!((_a = batch === null || batch === void 0 ? void 0 : batch.policyId) === null || _a === void 0 ? void 0 : _a.trim()))
            return { recipientAddress: null };
        const meta = await this.ref100Metadata.getMetadata(batch.policyId.trim(), bid);
        if (!meta || !meta.receiverAddresses.length)
            return { recipientAddress: null };
        const minterWallet = (_d = (_c = (_b = batch.minterProfile) === null || _b === void 0 ? void 0 : _b.walletAddress) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase()) !== null && _d !== void 0 ? _d : "";
        if (minterWallet && senderWallet === minterWallet) {
            const first = (_e = meta.receiverAddresses[0]) === null || _e === void 0 ? void 0 : _e.trim();
            return { recipientAddress: first !== null && first !== void 0 ? first : null };
        }
        const idx = meta.receiverAddresses.findIndex((addr) => (addr || "").trim().toLowerCase() === senderWallet);
        if (idx < 0 || idx >= meta.receiverAddresses.length - 1)
            return { recipientAddress: null };
        const next = (_g = (_f = meta.receiverAddresses[idx + 1]) === null || _f === void 0 ? void 0 : _f.trim()) !== null && _g !== void 0 ? _g : null;
        return { recipientAddress: next };
    }
};
exports.GetRecipientByRoadmapUseCase = GetRecipientByRoadmapUseCase;
exports.GetRecipientByRoadmapUseCase = GetRecipientByRoadmapUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(warehouse_repository_1.WAREHOUSE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, ref100_metadata_service_1.Ref100MetadataService,
        prisma_service_1.PrismaService])
], GetRecipientByRoadmapUseCase);
//# sourceMappingURL=get-recipient-by-roadmap.use-case.js.map