import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  WarehouseInventoryItem,
  WarehouseRepositoryPort,
} from "../domain/warehouse.repository";

@Injectable()
export class PrismaWarehouseRepository implements WarehouseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listInventoryByProfileId(
    profileId: number
  ): Promise<WarehouseInventoryItem[]> {
    const rows = await (this.prisma as any).warehouseInventory.findMany({
      where: { profileId },
      include: {
        batch: {
          select: { id: true, name: true, image: true, policyId: true },
        },
      },
      orderBy: { receivedAt: "desc" },
    });
    const visible = (rows || []).filter(
      (inv: any) => String(inv?.status ?? "IN_WAREHOUSE") !== "BURNED"
    );
    return visible.map(
      (inv: any): WarehouseInventoryItem => ({
        batchId: inv.batchId,
        batchName: inv.batch?.name ?? inv.batchId,
        image: inv.batch?.image ?? null,
        receivedAt: inv.receivedAt,
        outAt: inv.shippedAt ?? inv.consumedAt ?? null,
        policyId: inv.batch?.policyId ?? null,
        status: inv.status ?? "IN_WAREHOUSE",
      })
    );
  }

  async removeInventoryForProfile(
    profileId: number,
    batchId: string
  ): Promise<void> {
    await (this.prisma as any).warehouseInventory.deleteMany({
      where: { batchId, profileId },
    });
  }

  async markAsShippedForProfile(
    profileId: number,
    batchId: string
  ): Promise<void> {
    await (this.prisma as any).warehouseInventory.updateMany({
      where: { batchId, profileId },
      data: { status: "ON_WAY", shippedAt: new Date(), lastMovedAt: new Date() },
    });
  }

  async addToWarehouseForProfile(
    profileId: number,
    batchId: string
  ): Promise<void> {
    await (this.prisma as any).warehouseInventory.upsert({
      where: { batchId_profileId: { batchId, profileId } },
      create: { batchId, profileId, status: "IN_WAREHOUSE" },
      update: { status: "IN_WAREHOUSE", shippedAt: null, lastMovedAt: new Date() },
    });
  }
}

