import { ConfigService } from "../config/config.service";
import { CardanoService } from "./cardano.service";
export type Ref100MetadataResult = {
    minterAddress: string | null;
    receiverAddresses: string[];
    receiverLocations?: string;
    receiverCoordinates?: string;
};
export declare class Ref100MetadataService {
    private readonly config;
    private readonly cardano;
    constructor(config: ConfigService, cardano: CardanoService);
    getMetadata(policyId: string, assetName: string): Promise<Ref100MetadataResult | null>;
    getMetadataOrThrow(policyId: string, assetName: string): Promise<Ref100MetadataResult>;
}
