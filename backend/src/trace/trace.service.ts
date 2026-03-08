import { Injectable } from "@nestjs/common";
import type { TraceResponse } from "./domain/trace.types";
import type { TraceHistoryResponse } from "./application/use-cases/trace-history.use-case";
import { TraceAssetUseCase } from "./application/use-cases/trace-asset.use-case";
import { TraceHistoryUseCase } from "./application/use-cases/trace-history.use-case";

@Injectable()
export class TraceService {
  constructor(
    private readonly traceAssetUseCase: TraceAssetUseCase,
    private readonly traceHistoryUseCase: TraceHistoryUseCase
  ) {}

  async trace(
    policyId: string,
    assetName: string,
    atTxHash?: string
  ): Promise<TraceResponse> {
    return this.traceAssetUseCase.execute(policyId, assetName, atTxHash);
  }

  async getHistory(
    policyId: string,
    assetName: string
  ): Promise<TraceHistoryResponse> {
    return this.traceHistoryUseCase.execute(policyId, assetName);
  }
}
