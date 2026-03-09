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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const jwt = require("jsonwebtoken");
const config_service_1 = require("../core/config/config.service");
const prisma_service_1 = require("../prisma/prisma.service");
const utils_1 = require("./utils");
let AuthService = class AuthService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.nonceStore = new Map();
    }
    generateNonce(stakeAddress) {
        const network = this.config.appNetwork === "mainnet" ? "mainnet" : "preprod";
        const addr = (0, utils_1.normalizeStakeAddress)(stakeAddress, network);
        if (!(0, utils_1.isPaymentAddress)(addr)) {
            const hint = addr.length > 0
                ? ` Received: ${addr.slice(0, 30)}${addr.length > 30 ? "..." : ""}`
                : " Received empty or invalid type.";
            throw new common_1.BadRequestException("Address must be a payment address (addr_test1... or addr1...) or a valid hex (56, 58 or 114 chars)." +
                hint);
        }
        const nonce = (0, crypto_1.randomBytes)(32).toString("hex");
        const ttlMs = 5 * 60 * 1000;
        this.nonceStore.set(addr, { nonce, expMs: Date.now() + ttlMs });
        return nonce;
    }
    async verifyAndIssueToken(params) {
        var _a, _b;
        const { stakeAddress, nonce, signature, key } = params;
        const network = this.config.appNetwork === "mainnet" ? "mainnet" : "preprod";
        const addr = (0, utils_1.normalizeStakeAddress)(stakeAddress, network);
        if (!(0, utils_1.isPaymentAddress)(addr)) {
            throw new common_1.BadRequestException("Address must be a payment address (addr_test1... or addr1...) or a valid hex (56, 58 or 114 chars).");
        }
        const item = this.nonceStore.get(addr);
        if (!item || item.nonce !== nonce || Date.now() > item.expMs) {
            throw new common_1.UnauthorizedException("Invalid or expired nonce.");
        }
        this.nonceStore.delete(addr);
        if (!signature || !key) {
            throw new common_1.UnauthorizedException("Missing signature or public key.");
        }
        await this.prisma.wallet.upsert({
            where: { address: addr },
            update: { lastLogin: new Date() },
            create: { address: addr, lastLogin: new Date() },
        });
        const profile = await this.prisma.profile.findFirst({
            where: { walletAddress: addr },
        });
        if (!profile) {
            return {
                needProfile: true,
                roles: [
                    { id: 1, code: "ENTERPRISE" },
                    { id: 2, code: "TRANSIT" },
                    { id: 3, code: "AGENT" },
                    { id: 4, code: "SHIPPER" },
                ],
            };
        }
        const secret = this.config.jwtSecret;
        if (!secret) {
            throw new common_1.UnauthorizedException("JWT_SECRET is not configured.");
        }
        const payload = {
            sub: addr,
            stakeAddress: addr,
            profileId: profile.id,
            role: profile.roleCode,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            location: profile.location,
            coordinates: profile.coordinates,
        };
        const token = jwt.sign(payload, secret, { expiresIn: "7d" });
        return {
            token,
            profile: {
                id: profile.id,
                role: profile.roleCode,
                displayName: profile.displayName,
                avatarUrl: profile.avatarUrl,
                location: (_a = profile.location) !== null && _a !== void 0 ? _a : null,
                coordinates: (_b = profile.coordinates) !== null && _b !== void 0 ? _b : null,
            },
        };
    }
    async createProfileAndIssueToken(params) {
        var _a, _b;
        const { stakeAddress, roleCode, displayName, location, coordinates } = params;
        const network = this.config.appNetwork === "mainnet" ? "mainnet" : "preprod";
        const addr = (0, utils_1.normalizeStakeAddress)(stakeAddress, network);
        if (!(0, utils_1.isPaymentAddress)(addr)) {
            throw new common_1.BadRequestException("Address must be a payment address (addr_test1... or addr1...) or a valid hex (56, 58 or 114 chars).");
        }
        await this.prisma.wallet.upsert({
            where: { address: addr },
            update: { lastLogin: new Date() },
            create: { address: addr, lastLogin: new Date() },
        });
        const profile = await this.prisma.profile.upsert({
            where: { walletAddress: addr },
            update: {
                roleCode: roleCode.toUpperCase(),
                displayName,
                location: location !== null && location !== void 0 ? location : null,
                coordinates: coordinates !== null && coordinates !== void 0 ? coordinates : null,
            },
            create: {
                walletAddress: addr,
                roleCode: roleCode.toUpperCase(),
                displayName,
                location: location !== null && location !== void 0 ? location : null,
                coordinates: coordinates !== null && coordinates !== void 0 ? coordinates : null,
            },
        });
        const secret = this.config.jwtSecret;
        if (!secret) {
            throw new common_1.UnauthorizedException("JWT_SECRET is not configured.");
        }
        const payload = {
            sub: addr,
            stakeAddress: addr,
            profileId: profile.id,
            role: profile.roleCode,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            location: profile.location,
            coordinates: profile.coordinates,
        };
        const token = jwt.sign(payload, secret, { expiresIn: "7d" });
        return {
            token,
            profile: {
                id: profile.id,
                role: profile.roleCode,
                displayName: profile.displayName,
                avatarUrl: profile.avatarUrl,
                location: (_a = profile.location) !== null && _a !== void 0 ? _a : null,
                coordinates: (_b = profile.coordinates) !== null && _b !== void 0 ? _b : null,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map