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
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const warehouse_service_1 = require("./warehouse.service");
const warehouse_dto_1 = require("./dto/warehouse.dto");
let WarehouseController = class WarehouseController {
    constructor(warehouse) {
        this.warehouse = warehouse;
    }
    async getMyWarehouse(user) {
        const items = await this.warehouse.listMyWarehouseInventory(user.profileId);
        return { items };
    }
    async removeItem(body, user) {
        if (!body.batchId || typeof body.batchId !== "string" || !body.batchId.trim()) {
            throw new common_1.BadRequestException("batchId is required.");
        }
        await this.warehouse.removeOneFromWarehouse(user.profileId, body.batchId.trim());
        return { ok: true };
    }
    async markShipped(body, user) {
        if (!body.batchId || typeof body.batchId !== "string" || !body.batchId.trim()) {
            throw new common_1.BadRequestException("batchId is required.");
        }
        await this.warehouse.markAsShipped(user.profileId, body.batchId.trim());
        return { ok: true };
    }
    async getRecipientByRoadmap(batchId, user) {
        if (!batchId || typeof batchId !== "string" || !batchId.trim()) {
            return { recipientAddress: null };
        }
        return this.warehouse.getRecipientByRoadmap(user.profileId, batchId.trim());
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getMyWarehouse", null);
__decorate([
    (0, common_1.Post)("remove-item"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.WarehouseBatchIdDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Post)("mark-shipped"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.WarehouseBatchIdDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "markShipped", null);
__decorate([
    (0, common_1.Get)("recipient-by-roadmap"),
    __param(0, (0, common_1.Query)("batchId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getRecipientByRoadmap", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, common_1.Controller)("warehouse"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE", "TRANSIT", "AGENT"),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
//# sourceMappingURL=warehouse.controller.js.map