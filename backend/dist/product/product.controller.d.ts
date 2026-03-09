import { ProductService } from "./product.service";
import type { AuthUser } from "../auth/types/auth-user";
import { MintProductDto, UpdateProductDto, RevokeProductDto, BurnProductDto, MintConfirmDto, UpdateConfirmDto, SubmitTxDto } from "./dto/product.dto";
export declare class ProductController {
    private readonly product;
    constructor(product: ProductService);
    listBatches(user: AuthUser): Promise<{
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
    mint(body: MintProductDto, _user: AuthUser): Promise<{
        unsignedTx: string;
        policyId?: string;
    }>;
    update(body: UpdateProductDto, _user: AuthUser): Promise<{
        unsignedTx: string;
    }>;
    revoke(body: RevokeProductDto, _user: AuthUser): Promise<{
        unsignedTx: string;
    }>;
    burn(body: BurnProductDto): Promise<{
        unsignedTx: string;
    }>;
    mintConfirm(body: MintConfirmDto, _user: AuthUser): Promise<{
        ok: boolean;
    }>;
    updateConfirm(body: UpdateConfirmDto, _user: AuthUser): Promise<{
        ok: boolean;
    }>;
    submit(body: SubmitTxDto): Promise<{
        txHash: string;
    }>;
    getRoadmap(code: string | undefined, user: AuthUser): Promise<{
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
