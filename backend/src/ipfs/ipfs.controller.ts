import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { IpfsService } from "./ipfs.service";

@Controller("ipfs")
export class IpfsController {
  constructor(
    private readonly ipfs: IpfsService,
  ) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async upload(
    @UploadedFile() file: { buffer: Buffer; originalname?: string; mimetype?: string } | undefined,
    @CurrentUser() _user: AuthUser,
  ): Promise<{ ipfsHash: string }> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        "No file uploaded. Send multipart/form-data with 'file' field.",
      );
    }
    const { ipfsHash } = await this.ipfs.uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    return { ipfsHash };
  }

  @Get("gateway-url/:hash")
  getGatewayUrl(@Param("hash") hash: string): { url: string } {
    const clean = (hash || "").trim().replace(/^ipfs:\/\//, "");
    if (!clean) {
      return { url: "" };
    }
    const url = this.ipfs.getGatewayUrl(clean);
    return { url };
  }
}
