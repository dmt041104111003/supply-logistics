import type { AuthUser } from "../auth/types/auth-user";
import { WarehouseService } from "./warehouse.service";
import { WarehouseBatchIdDto } from "./dto/warehouse.dto";
export declare class WarehouseController {
    private readonly warehouse;
    constructor(warehouse: WarehouseService);
    getMyWarehouse(user: AuthUser): Promise<{
        items: {
            batchId: string;
            batchName: string;
            image: string | null;
            receivedAt: Date;
            outAt: Date | null;
            policyId: string | null;
            status: string;
        }[];
    }>;
    removeItem(body: WarehouseBatchIdDto, user: AuthUser): Promise<{
        ok: boolean;
    }>;
    markShipped(body: WarehouseBatchIdDto, user: AuthUser): Promise<{
        ok: boolean;
    }>;
    getRecipientByRoadmap(batchId: string | undefined, user: AuthUser): Promise<{
        recipientAddress: string | null;
    }>;
}
