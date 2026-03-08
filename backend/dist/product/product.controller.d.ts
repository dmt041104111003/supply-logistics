import { ProductService } from "./product.service";
import { AuthService } from "../auth/auth.service";
import { MintProductDto, UpdateProductDto, RevokeProductDto, BurnProductDto, MintConfirmDto, UpdateConfirmDto, SubmitTxDto } from "./dto/product.dto";
export declare class ProductController {
    private readonly product;
    private readonly auth;
    constructor(product: ProductService, auth: AuthService);
    listBatches(token?: string): Promise<{
        total: number;
        items: {
            id: number;
            batchId: string;
            name: string;
            description: string | null;
            image: string | null;
            certificate: string | null;
            createdAt: Date;
            policyId: string | null;
            sku: string | null;
            grossWeightKg: number | null;
            netWeightKg: number | null;
            originSiteCode: string | null;
            canUpdate: boolean;
        }[];
    }>;
    mint(body: MintProductDto, token?: string): Promise<{
        unsignedTx: string;
        policyId?: string;
    }>;
    update(body: UpdateProductDto, token?: string): Promise<{
        unsignedTx: string;
    }>;
    revoke(body: RevokeProductDto, token?: string): Promise<{
        unsignedTx: string;
    }>;
    burn(body: BurnProductDto): Promise<{
        unsignedTx: string;
    }>;
    mintConfirm(body: MintConfirmDto, token?: string): Promise<{
        ok: boolean;
    }>;
    updateConfirm(body: UpdateConfirmDto, token?: string): Promise<{
        ok: boolean;
    }>;
    submit(body: SubmitTxDto): Promise<{
        txHash: string;
    }>;
    getRoadmap(code: string | undefined, token?: string): Promise<{
        items: {
            stepIndex: number;
            toAddress: string | null;
        }[];
    }>;
    getBatchQrPayload(code: string): Promise<{
        policyId: string;
        assetName: string;
        minter: string | null;
        owners: string[];
    }>;
    getBatchByCode(code: string): Promise<{
        policyId: string | null;
        assetName: string;
        nftUnit: string | null;
    }>;
}
