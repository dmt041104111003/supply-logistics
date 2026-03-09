import { Body, Controller, Post, BadRequestException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { UploadService } from "./upload.service";

@Controller("upload")
export class UploadController {
  constructor(
    private readonly upload: UploadService,
  ) {}

  @Post("image")
  @UseGuards(JwtAuthGuard)
  async uploadImage(
    @CurrentUser() _user: AuthUser,
    @Body() body?: { imageDataUrl?: string; folder?: string },
  ): Promise<{ url: string }> {
    const imageDataUrl = body?.imageDataUrl;
    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.trim()) {
      throw new BadRequestException("imageDataUrl is required.");
    }

    const folder = (body?.folder && typeof body.folder === "string" && body.folder.trim())
      ? body.folder.trim()
      : "uploads";

    const url = await this.upload.uploadImage(imageDataUrl, folder);
    return { url };
  }
}
