import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "../core/config/config.service";
import {
  PROFILE_REPOSITORY,
  ProfileRepositoryPort,
} from "./domain/profile.repository";
import { ListProfilesUseCase } from "./application/use-cases/list-profiles.use-case";
import { ListProfilesByRoleUseCase } from "./application/use-cases/list-profiles-by-role.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import { UploadProfileAvatarUseCase } from "./application/use-cases/upload-profile-avatar.use-case";

@Injectable()
export class ProfileService {
  constructor(
    private readonly config: ConfigService,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepositoryPort,
    private readonly listProfilesUseCase: ListProfilesUseCase,
    private readonly listProfilesByRoleUseCase: ListProfilesByRoleUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly uploadProfileAvatarUseCase: UploadProfileAvatarUseCase
  ) {}

  async listProfiles(): Promise<
    { walletAddress: string; displayName: string; location: string | null; coordinates: string | null; role: string | null }[]
  > {
    return this.listProfilesUseCase.execute();
  }

  async listProfilesByRoleCode(roleCode: string): Promise<{ id: number; displayName: string; walletAddress: string }[]> {
    return this.listProfilesByRoleUseCase.execute(roleCode);
  }

  async updateProfile(profileId: number, params: { displayName: string; location?: string; coordinates?: string }): Promise<{
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
    const secret = this.config.jwtSecret;
    if (!secret) {
      throw new UnauthorizedException("JWT_SECRET is not configured.");
    }
    const profile = await this.updateProfileUseCase.execute(profileId, params);
    const nextPayload = {
      sub: profile.walletAddress,
      stakeAddress: profile.walletAddress,
      profileId: profile.id,
      role: profile.roleCode,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
      coordinates: profile.coordinates,
    };
    const nextToken = jwt.sign(nextPayload, secret, { expiresIn: "7d" });
    return {
      token: nextToken,
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

  async uploadAvatar(profileId: number, imageDataUrl: string): Promise<{
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
    const secret = this.config.jwtSecret;
    if (!secret) {
      throw new UnauthorizedException("JWT_SECRET is not configured.");
    }
    const profile = await this.uploadProfileAvatarUseCase.execute(profileId, imageDataUrl);
    const nextPayload = {
      sub: profile.walletAddress,
      stakeAddress: profile.walletAddress,
      profileId: profile.id,
      role: profile.roleCode,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
      coordinates: profile.coordinates,
    };
    const nextToken = jwt.sign(nextPayload, secret, { expiresIn: "7d" });
    return {
      token: nextToken,
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
