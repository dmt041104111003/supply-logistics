import { CanActivate } from "@nestjs/common";
import { ConfigService } from "../../core/config/config.service";
import { PrismaService } from "../../prisma/prisma.service";
export declare class JwtAuthGuard implements CanActivate {
    private readonly config;
    private readonly prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    canActivate(context: any): Promise<boolean>;
}
