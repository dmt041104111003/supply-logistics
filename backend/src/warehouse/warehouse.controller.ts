import { Controller, Get, Post, Body, Query, BadRequestException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { WarehouseService } from "./warehouse.service";
import { WarehouseBatchIdDto } from "./dto/warehouse.dto";

@Controller("warehouse")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ENTERPRISE", "TRANSIT", "AGENT")
export class WarehouseController {
  constructor(
    private readonly warehouse: WarehouseService,
  ) {}

  @Get()
  async getMyWarehouse(
    @CurrentUser() user: AuthUser,
  ): Promise<{
    items: {
      batchId: string;
      batchName: string;
      image: string | null;
      receivedAt: Date;
      outAt: Date | null;
      policyId: string | null;
      status: string;
    }[];
  }> {
    const items = await this.warehouse.listMyWarehouseInventory(user.profileId);
    return { items };
  }

  @Post("remove-item")
  async removeItem(
    @Body() body: WarehouseBatchIdDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ ok: boolean }> {
    if (!body.batchId || typeof body.batchId !== "string" || !body.batchId.trim()) {
      throw new BadRequestException("batchId is required.");
    }
    await this.warehouse.removeOneFromWarehouse(user.profileId, body.batchId.trim());
    return { ok: true };
  }

  @Post("mark-shipped")
  async markShipped(
    @Body() body: WarehouseBatchIdDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ ok: boolean }> {
    if (!body.batchId || typeof body.batchId !== "string" || !body.batchId.trim()) {
      throw new BadRequestException("batchId is required.");
    }
    await this.warehouse.markAsShipped(user.profileId, body.batchId.trim());
    return { ok: true };
  }

  @Get("recipient-by-roadmap")
  async getRecipientByRoadmap(
    @Query("batchId") batchId: string | undefined,
    @CurrentUser() user: AuthUser,
  ): Promise<{ recipientAddress: string | null }> {
    if (!batchId || typeof batchId !== "string" || !batchId.trim()) {
      return { recipientAddress: null };
    }
    return this.warehouse.getRecipientByRoadmap(user.profileId, batchId.trim());
  }
}
