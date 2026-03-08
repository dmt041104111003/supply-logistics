import { PrismaService } from "../../prisma/prisma.service";
import { MintBatchParams, ProductBatchListItem, ProductBatchSnapshot, ProductRepositoryPort, UpdateBatchParams } from "../domain/product.repository";
export declare class PrismaProductRepository implements ProductRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listBatchesByMinter(profileId: number): Promise<ProductBatchListItem[]>;
    upsertBatchOnMint(params: MintBatchParams): Promise<void>;
    findBatchByCode(code: string): Promise<ProductBatchSnapshot | null>;
    getMinterWalletAddressByBatchCode(code: string): Promise<string | null>;
    updateBatch(params: UpdateBatchParams): Promise<void>;
    deleteBatch(batchId: string): Promise<void>;
}
