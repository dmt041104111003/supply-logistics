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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const product_service_1 = require("./product.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const product_dto_1 = require("./dto/product.dto");
function assertChangeAddressAndAssetName(body) {
    if (!body.changeAddress || !body.assetName) {
        throw new common_1.BadRequestException("Missing changeAddress or assetName");
    }
}
function assertMetadataOrRequiredFields(body) {
    const missingRequired = !body.name ||
        !body.image ||
        !(Array.isArray(body.receivers) && body.receivers.length) ||
        !body.receiverLocations ||
        !body.receiverCoordinates ||
        !body.minterLocation ||
        !body.minterCoordinates;
    if (!body.metadata && missingRequired) {
        throw new common_1.BadRequestException("Missing metadata or (name, image, receivers, receiverLocations, receiverCoordinates, minterLocation, minterCoordinates)");
    }
}
let ProductController = class ProductController {
    constructor(product) {
        this.product = product;
    }
    async listBatches(user) {
        const items = await this.product.listBatches(user.profileId);
        return { total: items.length, items };
    }
    async mint(body, _user) {
        assertChangeAddressAndAssetName(body);
        assertMetadataOrRequiredFields(body);
        return this.product.mint({
            changeAddress: body.changeAddress,
            assetName: body.assetName,
            metadata: body.metadata,
            receiver: body.receiver,
            name: body.name,
            image: body.image,
            receivers: body.receivers,
            receiverLocations: body.receiverLocations,
            receiverCoordinates: body.receiverCoordinates,
            minterLocation: body.minterLocation,
            minterCoordinates: body.minterCoordinates,
            propertiesJson: body.propertiesJson,
            certificate: body.certificate,
            walletUtxos: body.walletUtxos,
            utxoAddresses: body.utxoAddresses,
        });
    }
    async update(body, _user) {
        assertChangeAddressAndAssetName(body);
        assertMetadataOrRequiredFields(body);
        return this.product.update({
            changeAddress: body.changeAddress,
            assetName: body.assetName,
            txHash: body.txHash,
            metadata: body.metadata,
            name: body.name,
            image: body.image,
            receivers: body.receivers,
            receiverLocations: body.receiverLocations,
            receiverCoordinates: body.receiverCoordinates,
            minterLocation: body.minterLocation,
            minterCoordinates: body.minterCoordinates,
            propertiesJson: body.propertiesJson,
            certificate: body.certificate,
            walletUtxos: body.walletUtxos,
            utxoAddresses: body.utxoAddresses,
        });
    }
    async revoke(body, _user) {
        assertChangeAddressAndAssetName(body);
        return this.product.revoke({
            changeAddress: body.changeAddress,
            assetName: body.assetName,
            txHash: body.txHash,
            walletUtxos: body.walletUtxos,
            utxoAddresses: body.utxoAddresses,
        });
    }
    async burn(body) {
        assertChangeAddressAndAssetName(body);
        return this.product.burn({
            changeAddress: body.changeAddress,
            assetName: body.assetName,
            txHash: body.txHash,
            policyId: body.policyId,
            walletUtxos: body.walletUtxos,
            utxoAddresses: body.utxoAddresses,
        });
    }
    async mintConfirm(body, _user) {
        var _a;
        if (!body.txHash || !body.assetName || !body.name || body.minterProfileId == null) {
            throw new common_1.BadRequestException("Missing txHash, assetName, name or minterProfileId");
        }
        await this.product.recordTx({
            action: "MINT",
            txHash: body.txHash,
            assetName: body.assetName,
            profileId: body.minterProfileId,
            name: body.name,
            description: body.description,
            image: (_a = body.image) !== null && _a !== void 0 ? _a : "",
            certificate: body.certificate,
            standard: body.standard,
            properties: body.properties,
            metadata: body.metadata,
            policyId: body.policyId,
            receivers: body.receivers,
        });
        return { ok: true };
    }
    async updateConfirm(body, _user) {
        if (!body.txHash || !body.assetName || body.profileId == null) {
            throw new common_1.BadRequestException("Missing txHash, assetName or profileId");
        }
        await this.product.recordTx({
            action: "UPDATE",
            txHash: body.txHash,
            assetName: body.assetName,
            profileId: body.profileId,
            name: body.name,
            description: body.description,
            image: body.image,
            certificate: body.certificate,
            standard: body.standard,
            properties: body.properties,
            metadata: body.metadata,
            receivers: body.receivers,
        });
        return { ok: true };
    }
    async submit(body) {
        var _a;
        const raw = (_a = body.signedTxBase64) !== null && _a !== void 0 ? _a : body.signedTx;
        if (!raw || typeof raw !== "string") {
            throw new common_1.BadRequestException("Missing signedTx or signedTxBase64");
        }
        return this.product.submitSignedTx(raw, !!body.signedTxBase64, body.deleteBatchOnSuccess);
    }
    async getRoadmap(code, user) {
        if (!code || typeof code !== "string" || !code.trim()) {
            return { items: [] };
        }
        const items = await this.product.listRoadmap(code.trim());
        return { items };
    }
    async getBatchQrPayload(code) {
        if (!code || typeof code !== "string" || !code.trim()) {
            throw new common_1.BadRequestException("code is required");
        }
        return this.product.getBatchQrPayload(code.trim());
    }
    async getBatchByCode(code) {
        if (!code || typeof code !== "string" || !code.trim()) {
            throw new common_1.BadRequestException("code is required");
        }
        return this.product.getBatchSummaryByCode(code.trim());
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Get)("batches"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "listBatches", null);
__decorate([
    (0, common_1.Post)("mint"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.MintProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "mint", null);
__decorate([
    (0, common_1.Post)("update"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.UpdateProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Post)("revoke"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.RevokeProductDto, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)("burn"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.BurnProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "burn", null);
__decorate([
    (0, common_1.Post)("mint/confirm"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.MintConfirmDto, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "mintConfirm", null);
__decorate([
    (0, common_1.Post)("update/confirm"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.UpdateConfirmDto, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateConfirm", null);
__decorate([
    (0, common_1.Post)("submit"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.SubmitTxDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)("roadmap"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.Query)("code")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getRoadmap", null);
__decorate([
    (0, common_1.Get)("batch/:code/qr-payload"),
    __param(0, (0, common_1.Param)("code")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getBatchQrPayload", null);
__decorate([
    (0, common_1.Get)("batch/:code"),
    __param(0, (0, common_1.Param)("code")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getBatchByCode", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)("product"),
    __metadata("design:paramtypes", [product_service_1.ProductService])
], ProductController);
//# sourceMappingURL=product.controller.js.map