import type { MeshWallet } from "@meshsdk/core";
import { MeshAdapter, type MeshAdapterDeps } from "./mesh.adapter";
export type Cip68ContractOpts = {
    wallet?: MeshWallet;
    minterMintScriptCbor?: string;
} & MeshAdapterDeps;
export declare class Cip68Contract extends MeshAdapter {
    constructor(opts?: Cip68ContractOpts);
    private get appNetwork();
    mint: (params: {
        assetName: string;
        metadata: Record<string, string>;
        quantity: string;
        receiver: string;
    }[]) => Promise<string>;
    burnRef100: (params: {
        assetName: string;
        txHash?: string;
    }[]) => Promise<string>;
    revoke: (params: {
        assetName: string;
        txHash?: string;
    }[]) => Promise<string>;
    burn222: (params: {
        assetName: string;
        quantity: string;
        txHash?: string;
        policyId?: string;
    }[]) => Promise<string>;
    burn: (params: {
        assetName: string;
        quantity: string;
        txHash?: string;
        policyId?: string;
    }[]) => Promise<string>;
    update: (params: {
        assetName: string;
        metadata: Record<string, string>;
        txHash?: string;
    }[]) => Promise<string>;
}
