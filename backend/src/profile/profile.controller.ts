import { Body, Controller, Get, HttpException, HttpStatus, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { ProfileService } from "./profile.service";

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
    if (!role?.trim()) {
      throw new HttpException(
        { error: "Missing role" },
        HttpStatus.BAD_REQUEST
      );
    }
    return this.profileService.listProfilesByRoleCode(role.trim());
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
    const { displayName, location, coordinates } = body;

    if (!displayName) {
      throw new HttpException(
        { error: "Missing profile update information" },
        HttpStatus.BAD_REQUEST
      );
    }

    return this.profileService.updateProfile(user.profileId, {
      displayName,
      location,
      coordinates,
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
    const { imageDataUrl } = body;

    if (!imageDataUrl) {
      throw new HttpException(
        { error: "Missing avatar upload information" },
        HttpStatus.BAD_REQUEST
      );
    }

    return this.profileService.uploadAvatar(user.profileId, imageDataUrl);
  }
}
