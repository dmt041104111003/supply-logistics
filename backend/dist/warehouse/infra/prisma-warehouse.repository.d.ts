import { PrismaService } from "../../prisma/prisma.service";
import { WarehouseInventoryItem, WarehouseRepositoryPort } from "../domain/warehouse.repository";
export declare class PrismaWarehouseRepository implements WarehouseRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listInventoryByProfileId(profileId: number): Promise<WarehouseInventoryItem[]>;
    removeInventoryForProfile(profileId: number, batchId: string): Promise<void>;
    markAsShippedForProfile(profileId: number, batchId: string): Promise<void>;
    addToWarehouseForProfile(profileId: number, batchId: string): Promise<void>;
}
