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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const config_service_1 = require("../../core/config/config.service");
const prisma_service_1 = require("../../prisma/prisma.service");
function extractBearerToken(req) {
    const raw = (req.headers.authorization || "").trim();
    if (!raw)
        return null;
    const [scheme, token] = raw.split(/\s+/);
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token)
        return null;
    return token.trim() || null;
}
let JwtAuthGuard = class JwtAuthGuard {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    async canActivate(context) {
        var _a;
        const http = context.switchToHttp();
        const req = http.getRequest();
        const token = extractBearerToken(req);
        if (!token) {
            throw new common_1.UnauthorizedException("Missing Authorization Bearer token.");
        }
        const secret = this.config.jwtSecret;
        if (!secret) {
            throw new common_1.UnauthorizedException("JWT_SECRET is not configured.");
        }
        let payload;
        try {
            payload = jwt.verify(token, secret);
        }
        catch (_b) {
            throw new common_1.UnauthorizedException("Invalid token.");
        }
        if (!payload || typeof payload !== "object") {
            throw new common_1.UnauthorizedException("Invalid token payload.");
        }
        const p = payload;
        if (typeof p.profileId !== "number" || typeof p.role !== "string") {
            throw new common_1.UnauthorizedException("Invalid token payload.");
        }
        const profile = await this.prisma.profile.findUnique({
            where: { id: p.profileId },
            select: { roleCode: true },
        });
        const roleFromDb = (_a = profile === null || profile === void 0 ? void 0 : profile.roleCode) !== null && _a !== void 0 ? _a : null;
        if (!roleFromDb) {
            throw new common_1.UnauthorizedException("Profile not found.");
        }
        req.user = {
            sub: typeof p.sub === "string" ? p.sub : "",
            stakeAddress: typeof p.stakeAddress === "string" ? p.stakeAddress : "",
            profileId: p.profileId,
            role: roleFromDb,
            displayName: typeof p.displayName === "string" ? p.displayName : undefined,
            avatarUrl: p.avatarUrl === null || typeof p.avatarUrl === "string"
                ? p.avatarUrl
                : undefined,
            location: p.location === null || typeof p.location === "string"
                ? p.location
                : undefined,
            coordinates: p.coordinates === null || typeof p.coordinates === "string"
                ? p.coordinates
                : undefined,
        };
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map