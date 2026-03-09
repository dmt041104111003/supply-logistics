import {
  CanActivate,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "../../core/config/config.service";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../types/auth-user";

function extractBearerToken(req: Request): string | null {
  const raw = (req.headers.authorization || "").trim();
  if (!raw) return null;
  const [scheme, token] = raw.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest() as Request & { user?: AuthUser };

    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException("Missing Authorization Bearer token.");
    }

    const secret = this.config.jwtSecret;
    if (!secret) {
      throw new UnauthorizedException("JWT_SECRET is not configured.");
    }

    let payload: unknown;
    try {
      payload = jwt.verify(token, secret) as unknown;
    } catch {
      throw new UnauthorizedException("Invalid token.");
    }

    if (!payload || typeof payload !== "object") {
      throw new UnauthorizedException("Invalid token payload.");
    }

    const p = payload as Partial<AuthUser>;
    if (typeof p.profileId !== "number" || typeof p.role !== "string") {
      throw new UnauthorizedException("Invalid token payload.");
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: p.profileId },
      select: { roleCode: true },
    });
    const roleFromDb = profile?.roleCode ?? null;
    if (!roleFromDb) {
      throw new UnauthorizedException("Profile not found.");
    }

    req.user = {
      sub: typeof p.sub === "string" ? p.sub : "",
      stakeAddress: typeof p.stakeAddress === "string" ? p.stakeAddress : "",
      profileId: p.profileId,
      role: roleFromDb,
      displayName:
        typeof p.displayName === "string" ? p.displayName : undefined,
      avatarUrl:
        p.avatarUrl === null || typeof p.avatarUrl === "string"
          ? p.avatarUrl
          : undefined,
      location:
        p.location === null || typeof p.location === "string"
          ? p.location
          : undefined,
      coordinates:
        p.coordinates === null || typeof p.coordinates === "string"
          ? p.coordinates
          : undefined,
    };

    return true;
  }
}

