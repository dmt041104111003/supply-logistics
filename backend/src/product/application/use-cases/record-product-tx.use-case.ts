import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import {
  PRODUCT_REPOSITORY,
  MintBatchParams,
  ProductRepositoryPort,
} from "../../domain/product.repository";
import { WarehouseService } from "../../../warehouse/warehouse.service";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class RecordProductTxUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repository: ProductRepositoryPort,
    private readonly warehouse: WarehouseService,
    private readonly prisma: PrismaService
  ) {}

  async execute(params: {
    action: "MINT" | "UPDATE";
    txHash: string;
    assetName: string;
    profileId: number;
    name?: string;
    description?: string;
    image?: string;
    certificate?: string;
    standard?: string;
    properties?: object;
    metadata?: object;
    policyId?: string;
    receivers?: string[];
  }): Promise<void> {
    const { action, txHash, assetName, profileId } = params;

    if (action === "MINT") {
      const name = params.name ?? "";
      const description = params.description ?? "";
      const image = params.image ?? "";
      const properties = params.properties != null ? params.properties : {};
      let expiryDate: Date | undefined;
      const rawExpiry =
        (properties as any)?.ngayHetHan ??
        (params.properties as any)?.ngayHetHan ??
        undefined;
      if (rawExpiry) {
        const d =
          rawExpiry instanceof Date ? rawExpiry : new Date(String(rawExpiry));
        if (!Number.isNaN(d.getTime())) {
          expiryDate = d;
        }
      }
      const master = properties as any;
      const minterProfile = await (this.prisma as any).profile.findUnique({
        where: { id: profileId },
        select: { walletAddress: true, location: true },
      });
      const mintParams: MintBatchParams = {
        batchId: assetName,
        name,
        description: description || null,
        image: image || null,
        certificate: params.certificate ?? null,
        standard: params.standard ?? "Traceability-v1",
        mintTxHash: txHash,
        policyId: params.policyId,
        minterProfileId: profileId,
        expiryDate,
        sku: master.sku ?? null,
        grossWeightKg:
          master.grossWeightKg != null ? Number(master.grossWeightKg) : null,
        netWeightKg:
          master.netWeightKg != null ? Number(master.netWeightKg) : null,
        originSiteCode: minterProfile?.location ?? null,
        referenceUtxo: `${txHash}#0`,
      };

      await this.repository.upsertBatchOnMint(mintParams);

      await this.warehouse.addToWarehouse(profileId, assetName);
      return;
    }

    const batch = await this.repository.findBatchByCode(assetName);
    if (!batch) {
      throw new BadRequestException(`Batch not found: ${assetName}`);
    }

    if (action === "UPDATE") {
      let nextExpiryDate: Date | null = batch.expiryDate ?? null;
      const baseProps = (params.properties as any) ?? {};
      const rawNextExpiry = (baseProps as any)?.ngayHetHan;
      if (rawNextExpiry) {
        const d =
          rawNextExpiry instanceof Date
            ? rawNextExpiry
            : new Date(String(rawNextExpiry));
        if (!Number.isNaN(d.getTime())) {
          nextExpiryDate = d;
        }
      }
      const nextDescription =
        params.description !== undefined
          ? params.description
          : (batch.description as string | null);

      const updaterProfile = await (this.prisma as any).profile.findUnique({
        where: { id: profileId },
        select: { walletAddress: true, location: true },
      });

      await this.repository.updateBatch({
        batchId: assetName,
        name: params.name ?? batch.name,
        description: nextDescription,
        image: params.image ?? batch.image,
        certificate: params.certificate !== undefined ? params.certificate : batch.certificate,
        standard: params.standard ?? batch.standard,
        expiryDate: nextExpiryDate ?? null,
        sku: (baseProps as any).sku ?? batch.sku ?? null,
        grossWeightKg:
          (baseProps as any).grossWeightKg != null
            ? Number((baseProps as any).grossWeightKg)
            : batch.grossWeightKg ?? null,
        netWeightKg:
          (baseProps as any).netWeightKg != null
            ? Number((baseProps as any).netWeightKg)
            : batch.netWeightKg ?? null,
        originSiteCode: updaterProfile?.location ?? batch.originSiteCode ?? null,
        referenceUtxo: `${txHash}#0`,
      });

      return;
    }
  }
}

