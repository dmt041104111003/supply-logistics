import { RecipientByRoadmapResult, WarehouseRepositoryPort } from "../../domain/warehouse.repository";
import { Ref100MetadataService } from "../../../core/cardano/ref100-metadata.service";
import { PrismaService } from "../../../prisma/prisma.service";
export declare class GetRecipientByRoadmapUseCase {
    private readonly repository;
    private readonly ref100Metadata;
    private readonly prisma;
    constructor(repository: WarehouseRepositoryPort, ref100Metadata: Ref100MetadataService, prisma: PrismaService);
    execute(profileId: number, batchId: string): Promise<RecipientByRoadmapResult>;
}
