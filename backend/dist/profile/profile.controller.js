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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const profile_service_1 = require("./profile.service");
let ProfileController = class ProfileController {
    constructor(profileService) {
        this.profileService = profileService;
    }
    async listProfiles(_user) {
        return this.profileService.listProfiles();
    }
    async listProfilesByRole(_user, role) {
        if (!(role === null || role === void 0 ? void 0 : role.trim())) {
            throw new common_1.HttpException({ error: "Missing role" }, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.profileService.listProfilesByRoleCode(role.trim());
    }
    async updateProfile(body, user) {
        const { displayName, location, coordinates } = body;
        if (!displayName) {
            throw new common_1.HttpException({ error: "Missing profile update information" }, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.profileService.updateProfile(user.profileId, {
            displayName,
            location,
            coordinates,
        });
    }
    async uploadAvatar(body, user) {
        const { imageDataUrl } = body;
        if (!imageDataUrl) {
            throw new common_1.HttpException({ error: "Missing avatar upload information" }, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.profileService.uploadAvatar(user.profileId, imageDataUrl);
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)("profiles"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "listProfiles", null);
__decorate([
    (0, common_1.Get)("profiles/by-role"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("role")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "listProfilesByRole", null);
__decorate([
    (0, common_1.Patch)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)("avatar"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "uploadAvatar", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)("profile"),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map