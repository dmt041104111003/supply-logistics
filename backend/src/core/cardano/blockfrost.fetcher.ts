import axios from "axios";
import type { Transaction, UtXO } from "../../shared/types";
import type { AxiosInstance } from "axios";
import type { BlockfrostSupportedNetworks } from "@meshsdk/core";
import { parseHttpError } from "../../shared/common/utils";

export class BlockfrostNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message = "The requested component has not been found.") {
    super(message);
    this.name = "BlockfrostNotFoundError";
  }
}

export type BlockfrostFetcherDeps = {
  parseHttpError: (error: unknown) => string;
};

export class BlockfrostFetcher {
  private readonly _axiosInstance: AxiosInstance;
  private readonly _network: BlockfrostSupportedNetworks;
  private readonly _parseHttpError: (error: unknown) => string;

  constructor(
    projectIdOrBaseUrl: string,
    version?: number,
    deps?: BlockfrostFetcherDeps
  ) {
    const pe = deps?.parseHttpError ?? parseHttpError;
    this._parseHttpError = pe;

    if (
      typeof projectIdOrBaseUrl === "string" &&
      (projectIdOrBaseUrl.startsWith("http") || projectIdOrBaseUrl.startsWith("/"))
    ) {
      this._axiosInstance = axios.create({ baseURL: projectIdOrBaseUrl });
      this._network = "mainnet";
    } else {
      const projectId = projectIdOrBaseUrl;
      const network = projectId.slice(0, 7);
      this._axiosInstance = axios.create({
        baseURL: `https://cardano-${network}.blockfrost.io/api/v${version ?? 0}`,
        headers: { project_id: projectId },
      });
      this._network = network as BlockfrostSupportedNetworks;
    }
  }

  private async _get<T>(
    path: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    try {
      const config = params ? { params } : undefined;
      const { data, status } = await this._axiosInstance.get<T>(path, config);
      if (status === 200 || status === 202) return data;
      throw this._parseHttpError(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new BlockfrostNotFoundError(
          (error.response?.data as { message?: string })?.message ??
            "The requested component has not been found."
        );
      }
      throw this._parseHttpError(error);
    }
  }

  private async _postBinary(path: string, body: Buffer): Promise<string> {
    try {
      const { data, status } = await this._axiosInstance.post(path, body, {
        headers: { "Content-Type": "application/cbor" },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        transformRequest: [(d: unknown) => d],
      });
      if (status !== 200 && status !== 202) throw this._parseHttpError(data);
      if (typeof data === "string" && /^[a-fA-F0-9]{64}$/.test(data)) return data;
      if (data && typeof data === "object") {
        const v = (data as Record<string, unknown>).tx_id ?? (data as Record<string, unknown>).transaction_id;
        if (typeof v === "string" && /^[a-fA-F0-9]{64}$/.test(v)) return v;
      }
      throw this._parseHttpError(data);
    } catch (error) {
      throw this._parseHttpError(error);
    }
  }

  async submitTx(cborBuffer: Buffer): Promise<string> {
    return this._postBinary("/tx/submit", cborBuffer);
  }

  async fetchSpecificAsset(asset: string) {
    return this._get<unknown>(`/assets/${asset}`);
  }

  async fetchAssetAddresses(asset: string): Promise<Array<{ address: string; quantity: string }>> {
    const list: Array<{ address: string; quantity: string }> = [];
    const pageSize = 100;
    let page = 1;
    for (;;) {
      const data = await this._get<Array<{ address: string; quantity: string }>>(
        `/assets/${asset}/addresses`,
        { count: pageSize, page, order: "asc" }
      );
      if (!Array.isArray(data) || data.length === 0) break;
      list.push(...data);
      if (data.length < pageSize) break;
      page += 1;
    }
    return list;
  }

  async fetchAssetTransactions(asset: string) {
    return this._get<unknown>(`/assets/${asset}/transactions?order=desc`);
  }

  async fetchAllAssetTransactions(
    asset: string
  ): Promise<Array<{ tx_hash: string }>> {
    const allTxHashes: Array<{ tx_hash: string }> = [];
    const pageSize = 100;
    let currentPage = 1;
    for (;;) {
      const pageData = await this._get<Array<{ tx_hash: string }>>(
        `/assets/${asset}/transactions`,
        { page: currentPage, count: pageSize, order: "asc" }
      );
      if (!Array.isArray(pageData) || pageData.length === 0) break;
      allTxHashes.push(...pageData);
      if (pageData.length < pageSize) break;
      currentPage += 1;
    }
    return allTxHashes;
  }

  async fetchAllAssetTransactionsWithBlockTime(
    asset: string
  ): Promise<Array<{ tx_hash: string; block_height?: number; block_time?: number }>> {
    const all: Array<{ tx_hash: string; block_height?: number; block_time?: number }> = [];
    const pageSize = 100;
    let currentPage = 1;
    for (;;) {
      const pageData = await this._get<
        Array<{ tx_hash: string; block_height?: number; block_time?: number }>
      >(`/assets/${asset}/transactions`, {
        page: currentPage,
        count: pageSize,
        order: "asc",
      });
      if (!Array.isArray(pageData) || pageData.length === 0) break;
      all.push(...pageData);
      if (pageData.length < pageSize) break;
      currentPage += 1;
    }
    return all;
  }

  async fetchUtxoByAddress(address: string): Promise<Array<UtXO>> {
    const allUtxos: UtXO[] = [];
    const pageSize = 100;
    let currentPage = 1;
    try {
      for (;;) {
        const pageData = await this._get<UtXO[]>(
          `/addresses/${address}/utxos`,
          { page: currentPage, count: pageSize }
        );
        if (!Array.isArray(pageData) || pageData.length === 0) break;
        allUtxos.push(...pageData);
        if (pageData.length < pageSize) break;
        currentPage += 1;
      }
      return allUtxos;
    } catch (err: unknown) {
      if (err instanceof BlockfrostNotFoundError || (err as { statusCode?: number })?.statusCode === 404) {
        return [];
      }
      throw this._parseHttpError(err);
    }
  }

  async fetchTransactionsUTxO(txHash: string): Promise<Transaction> {
    return this._get<Transaction>(`/txs/${txHash}/utxos`);
  }

  async fetchSpecialTransaction(txHash: string) {
    return this._get<unknown>(`/txs/${txHash}`);
  }

  async fetchAddressUTXOsAsset(address: string, asset: string) {
    return this._get<unknown>(`/addresses/${address}/utxos/${asset}`);
  }
}

