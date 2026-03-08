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
exports.PrismaProductRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PrismaProductRepository = class PrismaProductRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listBatchesByMinter(profileId) {
        const items = await this.prisma.productBatch.findMany({
            where: { minterProfileId: profileId, revoked: false },
            select: {
                id: true,
                batchId: true,
                name: true,
                description: true,
                image: true,
                certificate: true,
                createdAt: true,
                policyId: true,
                sku: true,
                grossWeightKg: true,
                netWeightKg: true,
                originSiteCode: true,
            },
            orderBy: [{ createdAt: "asc" }, { batchId: "asc" }],
        });
        if (!Array.isArray(items))
            return [];
        return items.map((b) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return ({
                id: b.id,
                batchId: b.batchId,
                name: b.name,
                description: (_a = b.description) !== null && _a !== void 0 ? _a : null,
                image: (_b = b.image) !== null && _b !== void 0 ? _b : null,
                certificate: (_c = b.certificate) !== null && _c !== void 0 ? _c : null,
                createdAt: b.createdAt,
                policyId: (_d = b.policyId) !== null && _d !== void 0 ? _d : null,
                sku: (_e = b.sku) !== null && _e !== void 0 ? _e : null,
                grossWeightKg: (_f = b.grossWeightKg) !== null && _f !== void 0 ? _f : null,
                netWeightKg: (_g = b.netWeightKg) !== null && _g !== void 0 ? _g : null,
                originSiteCode: (_h = b.originSiteCode) !== null && _h !== void 0 ? _h : null,
            });
        });
    }
    async upsertBatchOnMint(params) {
        const { batchId, name, description, image, certificate, standard, mintTxHash, policyId, minterProfileId, expiryDate, sku, grossWeightKg, netWeightKg, originSiteCode, referenceUtxo, } = params;
        await this.prisma.productBatch.upsert({
            where: { batchId },
            create: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ batchId,
                name,
                description,
                image, certificate: certificate !== null && certificate !== void 0 ? certificate : undefined, standard,
                mintTxHash, policyId: policyId !== null && policyId !== void 0 ? policyId : undefined, minterProfileId }, (expiryDate !== undefined && { expiryDate })), (sku !== undefined && { sku })), (grossWeightKg !== undefined && { grossWeightKg })), (netWeightKg !== undefined && { netWeightKg })), (originSiteCode !== undefined && { originSiteCode })), (referenceUtxo !== undefined && { referenceUtxo })),
            update: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ mintTxHash,
                name,
                description,
                image, certificate: certificate !== null && certificate !== void 0 ? certificate : undefined, standard, policyId: policyId !== null && policyId !== void 0 ? policyId : undefined }, (expiryDate !== undefined && { expiryDate })), (sku !== undefined && { sku })), (grossWeightKg !== undefined && { grossWeightKg })), (netWeightKg !== undefined && { netWeightKg })), (originSiteCode !== undefined && { originSiteCode })), (referenceUtxo !== undefined && { referenceUtxo })),
        });
    }
    async findBatchByCode(code) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        const batch = await this.prisma.productBatch.findUnique({
            where: { batchId: code },
        });
        if (!batch)
            return null;
        return {
            batchId: batch.batchId,
            name: batch.name,
            description: (_a = batch.description) !== null && _a !== void 0 ? _a : null,
            image: (_b = batch.image) !== null && _b !== void 0 ? _b : null,
            certificate: (_c = batch.certificate) !== null && _c !== void 0 ? _c : null,
            standard: (_d = batch.standard) !== null && _d !== void 0 ? _d : null,
            policyId: (_e = batch.policyId) !== null && _e !== void 0 ? _e : null,
            expiryDate: (_f = batch.expiryDate) !== null && _f !== void 0 ? _f : null,
            sku: (_g = batch.sku) !== null && _g !== void 0 ? _g : null,
            grossWeightKg: (_h = batch.grossWeightKg) !== null && _h !== void 0 ? _h : null,
            netWeightKg: (_j = batch.netWeightKg) !== null && _j !== void 0 ? _j : null,
            originSiteCode: (_k = batch.originSiteCode) !== null && _k !== void 0 ? _k : null,
            referenceUtxo: (_l = batch.referenceUtxo) !== null && _l !== void 0 ? _l : null,
            lastUpdateTxHash: (_m = batch.lastUpdateTxHash) !== null && _m !== void 0 ? _m : null,
            lastUpdateAt: (_o = batch.lastUpdateAt) !== null && _o !== void 0 ? _o : null,
            revokeTxHash: (_p = batch.revokeTxHash) !== null && _p !== void 0 ? _p : null,
            revokedAt: (_q = batch.revokedAt) !== null && _q !== void 0 ? _q : null,
            revoked: (_r = batch.revoked) !== null && _r !== void 0 ? _r : false,
            burnTxHash: (_s = batch.burnTxHash) !== null && _s !== void 0 ? _s : null,
            burnedAt: (_t = batch.burnedAt) !== null && _t !== void 0 ? _t : null,
            burned: (_u = batch.burned) !== null && _u !== void 0 ? _u : false,
        };
    }
    async getMinterWalletAddressByBatchCode(code) {
        var _a;
        const row = await this.prisma.productBatch.findUnique({
            where: { batchId: code },
            select: {
                minterProfile: {
                    select: {
                        walletAddress: true,
                    },
                },
            },
        });
        const addr = (_a = row === null || row === void 0 ? void 0 : row.minterProfile) === null || _a === void 0 ? void 0 : _a.walletAddress;
        return typeof addr === "string" && addr.trim() ? addr.trim() : null;
    }
    async updateBatch(params) {
        const { batchId, name, description, image, certificate, standard, expiryDate, lastUpdateTxHash, lastUpdateAt, sku, grossWeightKg, netWeightKg, originSiteCode, } = params;
        await this.prisma.productBatch.update({
            where: { batchId },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name !== undefined && { name })), (description !== undefined && { description })), (image !== undefined && { image })), (certificate !== undefined && { certificate })), (standard !== undefined && { standard })), (expiryDate !== undefined && { expiryDate })), (lastUpdateTxHash !== undefined && { lastUpdateTxHash })), (lastUpdateAt !== undefined && { lastUpdateAt })), (sku !== undefined && { sku })), (grossWeightKg !== undefined && { grossWeightKg })), (netWeightKg !== undefined && { netWeightKg })), (originSiteCode !== undefined && { originSiteCode })),
        });
    }
    async deleteBatch(batchId) {
        const code = (batchId || "").trim();
        if (!code)
            return;
        await this.prisma.productBatch.delete({
            where: { batchId: code },
        });
    }
};
exports.PrismaProductRepository = PrismaProductRepository;
exports.PrismaProductRepository = PrismaProductRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaProductRepository);
//# sourceMappingURL=prisma-product.repository.js.map