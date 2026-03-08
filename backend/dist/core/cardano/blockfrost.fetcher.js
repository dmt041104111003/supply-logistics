"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockfrostFetcher = exports.BlockfrostNotFoundError = void 0;
const axios_1 = require("axios");
const utils_1 = require("../../shared/common/utils");
class BlockfrostNotFoundError extends Error {
    constructor(message = "The requested component has not been found.") {
        super(message);
        this.statusCode = 404;
        this.name = "BlockfrostNotFoundError";
    }
}
exports.BlockfrostNotFoundError = BlockfrostNotFoundError;
class BlockfrostFetcher {
    constructor(projectIdOrBaseUrl, version, deps) {
        var _a;
        const pe = (_a = deps === null || deps === void 0 ? void 0 : deps.parseHttpError) !== null && _a !== void 0 ? _a : utils_1.parseHttpError;
        this._parseHttpError = pe;
        if (typeof projectIdOrBaseUrl === "string" &&
            (projectIdOrBaseUrl.startsWith("http") || projectIdOrBaseUrl.startsWith("/"))) {
            this._axiosInstance = axios_1.default.create({ baseURL: projectIdOrBaseUrl });
            this._network = "mainnet";
        }
        else {
            const projectId = projectIdOrBaseUrl;
            const network = projectId.slice(0, 7);
            this._axiosInstance = axios_1.default.create({
                baseURL: `https://cardano-${network}.blockfrost.io/api/v${version !== null && version !== void 0 ? version : 0}`,
                headers: { project_id: projectId },
            });
            this._network = network;
        }
    }
    async _get(path, params) {
        var _a, _b, _c, _d;
        try {
            const config = params ? { params } : undefined;
            const { data, status } = await this._axiosInstance.get(path, config);
            if (status === 200 || status === 202)
                return data;
            throw this._parseHttpError(data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                throw new BlockfrostNotFoundError((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "The requested component has not been found.");
            }
            throw this._parseHttpError(error);
        }
    }
    async _postBinary(path, body) {
        var _a;
        try {
            const { data, status } = await this._axiosInstance.post(path, body, {
                headers: { "Content-Type": "application/cbor" },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                transformRequest: [(d) => d],
            });
            if (status !== 200 && status !== 202)
                throw this._parseHttpError(data);
            if (typeof data === "string" && /^[a-fA-F0-9]{64}$/.test(data))
                return data;
            if (data && typeof data === "object") {
                const v = (_a = data.tx_id) !== null && _a !== void 0 ? _a : data.transaction_id;
                if (typeof v === "string" && /^[a-fA-F0-9]{64}$/.test(v))
                    return v;
            }
            throw this._parseHttpError(data);
        }
        catch (error) {
            throw this._parseHttpError(error);
        }
    }
    async submitTx(cborBuffer) {
        return this._postBinary("/tx/submit", cborBuffer);
    }
    async fetchSpecificAsset(asset) {
        return this._get(`/assets/${asset}`);
    }
    async fetchAssetAddresses(asset) {
        const list = [];
        const pageSize = 100;
        let page = 1;
        for (;;) {
            const data = await this._get(`/assets/${asset}/addresses`, { count: pageSize, page, order: "asc" });
            if (!Array.isArray(data) || data.length === 0)
                break;
            list.push(...data);
            if (data.length < pageSize)
                break;
            page += 1;
        }
        return list;
    }
    async fetchAssetTransactions(asset) {
        return this._get(`/assets/${asset}/transactions?order=desc`);
    }
    async fetchAllAssetTransactions(asset) {
        const allTxHashes = [];
        const pageSize = 100;
        let currentPage = 1;
        for (;;) {
            const pageData = await this._get(`/assets/${asset}/transactions`, { page: currentPage, count: pageSize, order: "asc" });
            if (!Array.isArray(pageData) || pageData.length === 0)
                break;
            allTxHashes.push(...pageData);
            if (pageData.length < pageSize)
                break;
            currentPage += 1;
        }
        return allTxHashes;
    }
    async fetchAllAssetTransactionsWithBlockTime(asset) {
        const all = [];
        const pageSize = 100;
        let currentPage = 1;
        for (;;) {
            const pageData = await this._get(`/assets/${asset}/transactions`, {
                page: currentPage,
                count: pageSize,
                order: "asc",
            });
            if (!Array.isArray(pageData) || pageData.length === 0)
                break;
            all.push(...pageData);
            if (pageData.length < pageSize)
                break;
            currentPage += 1;
        }
        return all;
    }
    async fetchUtxoByAddress(address) {
        const allUtxos = [];
        const pageSize = 100;
        let currentPage = 1;
        try {
            for (;;) {
                const pageData = await this._get(`/addresses/${address}/utxos`, { page: currentPage, count: pageSize });
                if (!Array.isArray(pageData) || pageData.length === 0)
                    break;
                allUtxos.push(...pageData);
                if (pageData.length < pageSize)
                    break;
                currentPage += 1;
            }
            return allUtxos;
        }
        catch (err) {
            if (err instanceof BlockfrostNotFoundError || (err === null || err === void 0 ? void 0 : err.statusCode) === 404) {
                return [];
            }
            throw this._parseHttpError(err);
        }
    }
    async fetchTransactionsUTxO(txHash) {
        return this._get(`/txs/${txHash}/utxos`);
    }
    async fetchSpecialTransaction(txHash) {
        return this._get(`/txs/${txHash}`);
    }
    async fetchAddressUTXOsAsset(address, asset) {
        return this._get(`/addresses/${address}/utxos/${asset}`);
    }
}
exports.BlockfrostFetcher = BlockfrostFetcher;
//# sourceMappingURL=blockfrost.fetcher.js.map