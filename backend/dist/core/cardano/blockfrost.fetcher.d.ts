import type { Transaction, UtXO } from "../../shared/types";
export declare class BlockfrostNotFoundError extends Error {
    readonly statusCode = 404;
    constructor(message?: string);
}
export type BlockfrostFetcherDeps = {
    parseHttpError: (error: unknown) => string;
};
export declare class BlockfrostFetcher {
    private readonly _axiosInstance;
    private readonly _network;
    private readonly _parseHttpError;
    constructor(projectIdOrBaseUrl: string, version?: number, deps?: BlockfrostFetcherDeps);
    private _get;
    private _postBinary;
    submitTx(cborBuffer: Buffer): Promise<string>;
    fetchSpecificAsset(asset: string): Promise<unknown>;
    fetchAssetAddresses(asset: string): Promise<Array<{
        address: string;
        quantity: string;
    }>>;
    fetchAssetTransactions(asset: string): Promise<unknown>;
    fetchAllAssetTransactions(asset: string): Promise<Array<{
        tx_hash: string;
    }>>;
    fetchAllAssetTransactionsWithBlockTime(asset: string): Promise<Array<{
        tx_hash: string;
        block_height?: number;
        block_time?: number;
    }>>;
    fetchUtxoByAddress(address: string): Promise<Array<UtXO>>;
    fetchTransactionsUTxO(txHash: string): Promise<Transaction>;
    fetchSpecialTransaction(txHash: string): Promise<unknown>;
    fetchAddressUTXOsAsset(address: string, asset: string): Promise<unknown>;
}
