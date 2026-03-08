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
exports.PrismaWarehouseRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PrismaWarehouseRepository = class PrismaWarehouseRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listInventoryByProfileId(profileId) {
        const rows = await this.prisma.warehouseInventory.findMany({
            where: { profileId },
            include: {
                batch: {
                    select: { id: true, name: true, image: true, policyId: true },
                },
            },
            orderBy: { receivedAt: "desc" },
        });
        const visible = (rows || []).filter((inv) => { var _a; return String((_a = inv === null || inv === void 0 ? void 0 : inv.status) !== null && _a !== void 0 ? _a : "IN_WAREHOUSE") !== "BURNED"; });
        return visible.map((inv) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return ({
                batchId: inv.batchId,
                batchName: (_b = (_a = inv.batch) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : inv.batchId,
                image: (_d = (_c = inv.batch) === null || _c === void 0 ? void 0 : _c.image) !== null && _d !== void 0 ? _d : null,
                receivedAt: inv.receivedAt,
                outAt: (_f = (_e = inv.shippedAt) !== null && _e !== void 0 ? _e : inv.consumedAt) !== null && _f !== void 0 ? _f : null,
                policyId: (_h = (_g = inv.batch) === null || _g === void 0 ? void 0 : _g.policyId) !== null && _h !== void 0 ? _h : null,
                status: (_j = inv.status) !== null && _j !== void 0 ? _j : "IN_WAREHOUSE",
            });
        });
    }
    async removeInventoryForProfile(profileId, batchId) {
        await this.prisma.warehouseInventory.deleteMany({
            where: { batchId, profileId },
        });
    }
    async markAsShippedForProfile(profileId, batchId) {
        await this.prisma.warehouseInventory.updateMany({
            where: { batchId, profileId },
            data: { status: "ON_WAY", shippedAt: new Date(), lastMovedAt: new Date() },
        });
    }
    async addToWarehouseForProfile(profileId, batchId) {
        await this.prisma.warehouseInventory.upsert({
            where: { batchId_profileId: { batchId, profileId } },
            create: { batchId, profileId, status: "IN_WAREHOUSE" },
            update: { status: "IN_WAREHOUSE", shippedAt: null, lastMovedAt: new Date() },
        });
    }
};
exports.PrismaWarehouseRepository = PrismaWarehouseRepository;
exports.PrismaWarehouseRepository = PrismaWarehouseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaWarehouseRepository);
//# sourceMappingURL=prisma-warehouse.repository.js.map