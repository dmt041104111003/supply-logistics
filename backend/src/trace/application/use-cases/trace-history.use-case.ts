import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../../../core/config/config.service";
import { CardanoService } from "../../../core/cardano/cardano.service";
import { buildRef100Unit } from "../../../shared/common/utils";

export type TraceHistoryItem = {
  txHash: string;
  action: string;
  createdAt: string;
};

export type TraceHistoryResponse = {
  items: TraceHistoryItem[];
};

@Injectable()
export class TraceHistoryUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly cardano: CardanoService
  ) {}

  async execute(policyId: string, assetName: string): Promise<TraceHistoryResponse> {
    const policyIdTrimmed = policyId.trim();
    const assetNameTrimmed = assetName.trim();

    const ref100Unit = buildRef100Unit(
      policyIdTrimmed,
      assetNameTrimmed,
      this.config.cip68Prefix
    );

    let txs: Array<{ tx_hash: string; block_height?: number; block_time?: number }>;
    try {
      txs = await this.cardano.blockfrostFetcher.fetchAllAssetTransactionsWithBlockTime(
        ref100Unit
      );
    } catch {
      throw new NotFoundException(
        "Asset not found on chain for this policyId and assetName."
      );
    }

    if (!Array.isArray(txs) || txs.length === 0) {
      return { items: [] };
    }

    const items: TraceHistoryItem[] = txs.map((tx, index) => {
      const action = index === 0 ? "MINT" : "UPDATE";
      const blockTime = tx.block_time;
      const createdAt =
        typeof blockTime === "number" && blockTime > 0
          ? new Date(blockTime * 1000).toISOString()
          : "";
      return {
        txHash: tx.tx_hash?.trim() ?? "",
        action,
        createdAt,
      };
    });

    return { items };
  }
}
