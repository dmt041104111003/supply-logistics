import { ConfigService } from "../../../core/config/config.service";
import { CardanoService } from "../../../core/cardano/cardano.service";
export type TraceHistoryItem = {
    txHash: string;
    action: string;
    createdAt: string;
};
export type TraceHistoryResponse = {
    items: TraceHistoryItem[];
};
export declare class TraceHistoryUseCase {
    private readonly config;
    private readonly cardano;
    constructor(config: ConfigService, cardano: CardanoService);
    execute(policyId: string, assetName: string): Promise<TraceHistoryResponse>;
}
