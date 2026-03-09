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
exports.IpfsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const ipfs_service_1 = require("./ipfs.service");
let IpfsController = class IpfsController {
    constructor(ipfs) {
        this.ipfs = ipfs;
    }
    async upload(file, _user) {
        if (!file || !file.buffer || file.buffer.length === 0) {
            throw new common_1.BadRequestException("No file uploaded. Send multipart/form-data with 'file' field.");
        }
        const { ipfsHash } = await this.ipfs.uploadFile({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
        });
        return { ipfsHash };
    }
    getGatewayUrl(hash) {
        const clean = (hash || "").trim().replace(/^ipfs:\/\//, "");
        if (!clean) {
            return { url: "" };
        }
        const url = this.ipfs.getGatewayUrl(clean);
        return { url };
    }
};
exports.IpfsController = IpfsController;
__decorate([
    (0, common_1.Post)("upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", { limits: { fileSize: 10 * 1024 * 1024 } })),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ENTERPRISE"),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IpfsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)("gateway-url/:hash"),
    __param(0, (0, common_1.Param)("hash")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], IpfsController.prototype, "getGatewayUrl", null);
exports.IpfsController = IpfsController = __decorate([
    (0, common_1.Controller)("ipfs"),
    __metadata("design:paramtypes", [ipfs_service_1.IpfsService])
], IpfsController);
//# sourceMappingURL=ipfs.controller.js.map