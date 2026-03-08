import type { TraceResponse } from "./domain/trace.types";
import type { TraceHistoryResponse } from "./application/use-cases/trace-history.use-case";
import { TraceAssetUseCase } from "./application/use-cases/trace-asset.use-case";
import { TraceHistoryUseCase } from "./application/use-cases/trace-history.use-case";
export declare class TraceService {
    private readonly traceAssetUseCase;
    private readonly traceHistoryUseCase;
    constructor(traceAssetUseCase: TraceAssetUseCase, traceHistoryUseCase: TraceHistoryUseCase);
    trace(policyId: string, assetName: string, atTxHash?: string): Promise<TraceResponse>;
    getHistory(policyId: string, assetName: string): Promise<TraceHistoryResponse>;
}
