import { ConfigService } from "../../../core/config/config.service";
import { CardanoService } from "../../../core/cardano/cardano.service";
import { OrderService } from "../../../order/order.service";
import type { TraceResponse } from "../../domain/trace.types";
export declare class TraceAssetUseCase {
    private readonly config;
    private readonly cardano;
    private readonly order;
    constructor(config: ConfigService, cardano: CardanoService, order: OrderService);
    execute(policyId: string, assetName: string, atTxHash?: string | null): Promise<TraceResponse>;
}
