import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes } from "crypto";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "../core/config/config.service";
import { PrismaService } from "../prisma/prisma.service";
import { isPaymentAddress, normalizeStakeAddress } from "./utils";

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly nonceStore = new Map<
    string,
    { nonce: string; expMs: number }
  >();

  generateNonce(stakeAddress: string): string {
    const network = this.config.appNetwork === "mainnet" ? "mainnet" : "preprod";
    const addr = normalizeStakeAddress(stakeAddress, network);

    if (!isPaymentAddress(addr)) {
      const hint =
        addr.length > 0
          ? ` Received: ${addr.slice(0, 30)}${addr.length > 30 ? "..." : ""}`
          : " Received empty or invalid type.";
      throw new BadRequestException(
        "Address must be a payment address (addr_test1... or addr1...) or a valid hex (56, 58 or 114 chars)." +
          hint,
      );
    }

    const nonce = randomBytes(32).toString("hex");
    const ttlMs = 5 * 60 * 1000;
    this.nonceStore.set(addr, { nonce, expMs: Date.now() + ttlMs });
    return nonce;
  }

  async verifyAndIssueToken(
    params: { stakeAddress: string; nonce: string; signature: string; key: string }
  ): Promise<
        | {
            token: string;
            profile: {
              id: number;
              role: string;
              displayName: string;
              avatarUrl: string | null;
              location: string | null;
              coordinates: string | null;
            };
          }
        | {
            needProfile: true;
            roles: {
              id: number;
              code: string;
            }[];
          }
  > {
    const { stakeAddress, nonce, signature, key } = params;
    const network = this.config.appNetwork === "mainnet" ? "mainnet" : "preprod";
    const addr = normalizeStakeAddress(stakeAddress, network);

    if (!isPaymentAddress(addr)) {
      throw new BadRequestException(
        "Address must be a payment address (addr_test1... or addr1...) or a valid hex (56, 58 or 114 chars).",
      );
    }

    const item = this.nonceStore.get(addr);
    if (!item || item.nonce !== nonce || Date.now() > item.expMs) {
      throw new UnauthorizedException("Invalid or expired nonce.");
    }
    this.nonceStore.delete(addr);

    if (!signature || !key) {
      throw new UnauthorizedException("Missing signature or public key.");
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
        needProfile: true as const,
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
      throw new UnauthorizedException("JWT_SECRET is not configured.");
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
        location: profile.location ?? null,
        coordinates: profile.coordinates ?? null,
      },
    };
  }

  async createProfileAndIssueToken(
    params: {
      stakeAddress: string;
      roleCode: string;
      displayName: string;
      location?: string;
      coordinates?: string;
    }
  ): Promise<{
    token: string;
    profile: {
      id: number;
      role: string;
      displayName: string;
      avatarUrl: string | null;
      location: string | null;
      coordinates: string | null;
    };
  }> {
    const { stakeAddress, roleCode, displayName, location, coordinates } = params;
    const network = this.config.appNetwork === "mainnet" ? "mainnet" : "preprod";
    const addr = normalizeStakeAddress(stakeAddress, network);

    if (!isPaymentAddress(addr)) {
      throw new BadRequestException(
        "Address must be a payment address (addr_test1... or addr1...) or a valid hex (56, 58 or 114 chars).",
      );
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
        location: location ?? null,
        coordinates: coordinates ?? null,
      },
      create: {
        walletAddress: addr,
        roleCode: roleCode.toUpperCase(),
        displayName,
        location: location ?? null,
        coordinates: coordinates ?? null,
      },
    });

    const secret = this.config.jwtSecret;
    if (!secret) {
      throw new UnauthorizedException("JWT_SECRET is not configured.");
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
        location: profile.location ?? null,
        coordinates: profile.coordinates ?? null,
      },
    };
  }
}

