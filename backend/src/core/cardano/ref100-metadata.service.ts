import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import { CardanoService } from "./cardano.service";
import { buildRef100Unit } from "../../shared/common/utils";
import { datumToJson } from "./cip68/utils";

function decodeHexToUtf8(value: unknown): string {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  let hex = s;
  if (hex.startsWith("0x") || hex.startsWith("0X")) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]*$/.test(hex)) return s;
  try {
    return Buffer.from(hex, "hex").toString("utf8");
  } catch {
    return s;
  }
}

export type Ref100MetadataResult = {
  minterAddress: string | null;
  receiverAddresses: string[];
  receiverLocations?: string;
  receiverCoordinates?: string;
};

@Injectable()
export class Ref100MetadataService {
  constructor(
    private readonly config: ConfigService,
    private readonly cardano: CardanoService
  ) {}

  async getMetadata(
    policyId: string,
    assetName: string
  ): Promise<Ref100MetadataResult | null> {
    const pid = policyId?.trim();
    const name = assetName?.trim();
    if (!pid || !name) return null;

    const ref100Unit = buildRef100Unit(
      pid,
      name,
      this.config.cip68Prefix
    );
    let quantity = "0";
    try {
      const asset = (await this.cardano.blockfrostFetcher.fetchSpecificAsset(
        ref100Unit
      )) as { quantity?: string };
      quantity = asset?.quantity ?? "0";
    } catch {
      return null;
    }
    if (quantity === "0") return null;

    const holders = await this.cardano.blockfrostFetcher.fetchAssetAddresses(
      ref100Unit
    );
    const holderAddress =
      holders.length > 0 ? holders[0].address?.trim() : null;
    if (!holderAddress) return null;

    const utxosRaw = await this.cardano.blockfrostFetcher.fetchAddressUTXOsAsset(
      holderAddress,
      ref100Unit
    );
    const utxosList = Array.isArray(utxosRaw) ? utxosRaw : [];
    const firstUtxo = utxosList[0] as { tx_hash?: string; output_index?: number; inline_datum?: string | null } | undefined;
    let datumHex: string | null = firstUtxo?.inline_datum ?? null;
    if (!datumHex && firstUtxo?.tx_hash != null && firstUtxo?.output_index != null) {
      const tx = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(
        firstUtxo.tx_hash
      );
      const outputs = (tx as { outputs?: Array<{ output_index: number; inline_datum?: string }> })?.outputs ?? [];
      const out = outputs.find(
        (o: { output_index: number }) =>
          Number(o.output_index) === Number(firstUtxo?.output_index)
      );
      datumHex = out?.inline_datum ?? null;
    }
    if (!datumHex) return null;

    const metaRaw = await datumToJson(datumHex, { contain_pk: true });
    const meta =
      typeof metaRaw === "object" && metaRaw !== null
        ? (metaRaw as Record<string, string>)
        : {};

    const receiverAddressesStr =
      decodeHexToUtf8(meta.receiver_addresses) ||
      meta.receiver_addresses ||
      "";
    const receiverAddresses = receiverAddressesStr
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const minterAddress =
      decodeHexToUtf8(meta.minter_address) || meta.minter_address || null;
    const receiverLocations =
      decodeHexToUtf8(meta.receiver_locations) || meta.receiver_locations || undefined;
    const receiverCoordinates =
      decodeHexToUtf8(meta.receiver_coordinates) || meta.receiver_coordinates || undefined;

    return {
      minterAddress: minterAddress || null,
      receiverAddresses,
      receiverLocations: receiverLocations || undefined,
      receiverCoordinates: receiverCoordinates || undefined,
    };
  }

  async getMetadataOrThrow(
    policyId: string,
    assetName: string
  ): Promise<Ref100MetadataResult> {
    const result = await this.getMetadata(policyId.trim(), assetName.trim());
    if (!result) {
      throw new NotFoundException(
        "Ref100 metadata not found for this policy and asset. Asset may not exist or be revoked."
      );
    }
    return result;
  }
}
