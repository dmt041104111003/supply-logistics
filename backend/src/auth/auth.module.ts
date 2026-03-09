import { Module } from "@nestjs/common";
import { ConfigModule } from "../core/config/config.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

