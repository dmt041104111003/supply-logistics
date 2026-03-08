import { Inject, Injectable } from "@nestjs/common";
import {
  RecipientByRoadmapResult,
  WAREHOUSE_REPOSITORY,
  WarehouseRepositoryPort,
} from "../../domain/warehouse.repository";
import { Ref100MetadataService } from "../../../core/cardano/ref100-metadata.service";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GetRecipientByRoadmapUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly repository: WarehouseRepositoryPort,
    private readonly ref100Metadata: Ref100MetadataService,
    private readonly prisma: PrismaService
  ) {}

  async execute(
    profileId: number,
    batchId: string
  ): Promise<RecipientByRoadmapResult> {
    const bid = (batchId || "").trim();
    if (!bid) return { recipientAddress: null };

    const profile = await (this.prisma as any).profile.findUnique({
      where: { id: profileId },
      select: { walletAddress: true },
    });
    if (!profile?.walletAddress) return { recipientAddress: null };
    const senderWallet = profile.walletAddress.trim().toLowerCase();

    const batch = await (this.prisma as any).productBatch.findUnique({
      where: { batchId: bid },
      select: {
        policyId: true,
        minterProfile: { select: { walletAddress: true } },
      },
    });
    if (!batch?.policyId?.trim()) return { recipientAddress: null };

    const meta = await this.ref100Metadata.getMetadata(
      batch.policyId.trim(),
      bid
    );
    if (!meta || !meta.receiverAddresses.length) return { recipientAddress: null };

    const minterWallet =
      (batch.minterProfile as { walletAddress?: string } | null)?.walletAddress?.trim().toLowerCase() ?? "";
    if (minterWallet && senderWallet === minterWallet) {
      const first = meta.receiverAddresses[0]?.trim();
      return { recipientAddress: first ?? null };
    }

    const idx = meta.receiverAddresses.findIndex(
      (addr) => (addr || "").trim().toLowerCase() === senderWallet
    );
    if (idx < 0 || idx >= meta.receiverAddresses.length - 1)
      return { recipientAddress: null };
    const next = meta.receiverAddresses[idx + 1]?.trim() ?? null;
    return { recipientAddress: next };
  }
}

