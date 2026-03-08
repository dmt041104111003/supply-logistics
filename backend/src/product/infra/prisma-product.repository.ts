import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  MintBatchParams,
  ProductBatchListItem,
  ProductBatchSnapshot,
  ProductRepositoryPort,
  UpdateBatchParams,
} from "../domain/product.repository";

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listBatchesByMinter(
    profileId: number
  ): Promise<ProductBatchListItem[]> {
    const items = await (this.prisma as any).productBatch.findMany({
      where: { minterProfileId: profileId },
      select: {
        id: true,
        batchId: true,
        name: true,
        description: true,
        image: true,
        certificate: true,
        createdAt: true,
        policyId: true,
        sku: true,
        grossWeightKg: true,
        netWeightKg: true,
        originSiteCode: true,
      },
      orderBy: [{ createdAt: "asc" }, { batchId: "asc" }],
    });
    if (!Array.isArray(items)) return [];
    return items.map(
      (b): ProductBatchListItem => ({
        id: b.id,
        batchId: b.batchId,
        name: b.name,
        description: b.description ?? null,
        image: b.image ?? null,
        certificate: b.certificate ?? null,
        createdAt: b.createdAt,
        policyId: b.policyId ?? null,
        sku: b.sku ?? null,
        grossWeightKg: b.grossWeightKg ?? null,
        netWeightKg: b.netWeightKg ?? null,
        originSiteCode: b.originSiteCode ?? null,
      })
    );
  }

  async upsertBatchOnMint(params: MintBatchParams): Promise<void> {
    const {
      batchId,
      name,
      description,
      image,
      certificate,
      standard,
      mintTxHash,
      policyId,
      minterProfileId,
      expiryDate,
      sku,
      grossWeightKg,
      netWeightKg,
      originSiteCode,
      referenceUtxo,
    } = params;
    await (this.prisma as any).productBatch.upsert({
      where: { batchId },
      create: {
        batchId,
        name,
        description,
        image,
        certificate: certificate ?? undefined,
        standard,
        mintTxHash,
        policyId: policyId ?? undefined,
        minterProfileId,
        ...(expiryDate !== undefined && { expiryDate }),
        ...(sku !== undefined && { sku }),
        ...(grossWeightKg !== undefined && { grossWeightKg }),
        ...(netWeightKg !== undefined && { netWeightKg }),
        ...(originSiteCode !== undefined && { originSiteCode }),
        ...(referenceUtxo !== undefined && { referenceUtxo }),
      },
      update: {
        mintTxHash,
        name,
        description,
        image,
        certificate: certificate ?? undefined,
        standard,
        policyId: policyId ?? undefined,
        ...(expiryDate !== undefined && { expiryDate }),
        ...(sku !== undefined && { sku }),
        ...(grossWeightKg !== undefined && { grossWeightKg }),
        ...(netWeightKg !== undefined && { netWeightKg }),
        ...(originSiteCode !== undefined && { originSiteCode }),
        ...(referenceUtxo !== undefined && { referenceUtxo }),
      },
    });
  }

  async findBatchByCode(code: string): Promise<ProductBatchSnapshot | null> {
    const batch = await (this.prisma as any).productBatch.findUnique({
      where: { batchId: code },
    });
    if (!batch) return null;
    return {
      batchId: batch.batchId,
      name: batch.name,
      description: batch.description ?? null,
      image: batch.image ?? null,
      certificate: batch.certificate ?? null,
      standard: batch.standard ?? null,
      policyId: batch.policyId ?? null,
      expiryDate: batch.expiryDate ?? null,
      sku: batch.sku ?? null,
      grossWeightKg: batch.grossWeightKg ?? null,
      netWeightKg: batch.netWeightKg ?? null,
      originSiteCode: batch.originSiteCode ?? null,
      referenceUtxo: batch.referenceUtxo ?? null,
    };
  }

  async getMinterWalletAddressByBatchCode(code: string): Promise<string | null> {
    const row = await (this.prisma as any).productBatch.findUnique({
      where: { batchId: code },
      select: {
        minterProfile: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
    const addr = row?.minterProfile?.walletAddress;
    return typeof addr === "string" && addr.trim() ? addr.trim() : null;
  }

  async updateBatch(params: UpdateBatchParams): Promise<void> {
    const {
      batchId,
      name,
      description,
      image,
      certificate,
      standard,
      expiryDate,
      sku,
      grossWeightKg,
      netWeightKg,
      originSiteCode,
    } = params;
    await (this.prisma as any).productBatch.update({
      where: { batchId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(certificate !== undefined && { certificate }),
        ...(standard !== undefined && { standard }),
        ...(expiryDate !== undefined && { expiryDate }),
        ...(sku !== undefined && { sku }),
        ...(grossWeightKg !== undefined && { grossWeightKg }),
        ...(netWeightKg !== undefined && { netWeightKg }),
        ...(originSiteCode !== undefined && { originSiteCode }),
      },
    });
  }

  async deleteBatch(batchId: string): Promise<void> {
    const code = (batchId || "").trim();
    if (!code) return;
    await (this.prisma as any).productBatch.delete({
      where: { batchId: code },
    });
  }
}

