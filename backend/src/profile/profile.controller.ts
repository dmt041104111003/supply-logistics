import { BadRequestException, Body, Controller, Get, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { ProfileService } from "./profile.service";

function requireNonEmpty(value: unknown, message: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) throw new BadRequestException(message);
  return s;
}

@Controller("profile")
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) {}

  @Get("profiles")
  @UseGuards(JwtAuthGuard)
  async listProfiles(@CurrentUser() _user: AuthUser) {
    return this.profileService.listProfiles();
  }

  @Get("profiles/by-role")
  @UseGuards(JwtAuthGuard)
  async listProfilesByRole(
    @CurrentUser() _user: AuthUser,
    @Query("role") role?: string,
  ) {
    return this.profileService.listProfilesByRoleCode(
      requireNonEmpty(role, "Missing role"),
    );
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body()
    body: {
      displayName?: string;
      location?: string;
      coordinates?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    const displayName = requireNonEmpty(
      body?.displayName,
      "Missing profile update information",
    );
    return this.profileService.updateProfile(user.profileId, {
      displayName,
      location: body?.location,
      coordinates: body?.coordinates,
    });
  }

  @Post("avatar")
  @UseGuards(JwtAuthGuard)
  async uploadAvatar(
    @Body()
    body: {
      imageDataUrl?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.profileService.uploadAvatar(
      user.profileId,
      requireNonEmpty(body?.imageDataUrl, "Missing avatar upload information"),
    );
  }
}
