import { TraceService } from "./trace.service";
import { TraceBodyDto } from "./dto/trace.dto";
export declare class TraceController {
    private readonly traceService;
    constructor(traceService: TraceService);
    trace(body: TraceBodyDto): Promise<import("./domain/trace.types").TraceResponse>;
    getHistory(policyId: string, assetName: string): Promise<import("./application/use-cases/trace-history.use-case").TraceHistoryResponse>;
    getTrace(policyId: string, assetName: string, atTxHash?: string): Promise<import("./domain/trace.types").TraceResponse>;
}
