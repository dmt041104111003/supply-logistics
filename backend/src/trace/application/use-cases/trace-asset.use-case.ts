import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "../../../core/config/config.service";
import { CardanoService } from "../../../core/cardano/cardano.service";
import { OrderService } from "../../../order/order.service";
import { buildRef100Unit } from "../../../shared/common/utils";
import { datumToJson } from "../../../core/cardano/cip68/utils";
import {
  buildDisplay,
  buildNft222Unit,
  decodeHexToUtf8,
  parseCoordinates,
} from "../../utils";
import type { TraceResponse } from "../../domain/trace.types";

/** Trace is full on-chain: all data from Ref100/NFT222 chain and datum only. No DB (ProductBatch, Certificate, etc.). */

type Ref100Utxo = {
  tx_hash: string;
  output_index: number;
  amount: Array<{ unit: string; quantity: string }>;
  inline_datum?: string | null;
};

@Injectable()
export class TraceAssetUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly cardano: CardanoService,
    private readonly order: OrderService
  ) {}

  async execute(
    policyId: string,
    assetName: string,
    atTxHash?: string | null
  ): Promise<TraceResponse> {
    const policyIdTrimmed = policyId.trim();
    const assetNameTrimmed = assetName.trim();
    const isSnapshot = !!atTxHash?.trim();

    const ref100Unit = buildRef100Unit(
      policyIdTrimmed,
      assetNameTrimmed,
      this.config.cip68Prefix
    );
    let ref100Quantity = "0";
    try {
      const ref100Asset = (await this.cardano.blockfrostFetcher.fetchSpecificAsset(
        ref100Unit
      )) as { quantity?: string };
      ref100Quantity = ref100Asset?.quantity ?? "0";
    } catch {
      throw new NotFoundException(
        "Asset not found on chain for this policyId and assetName."
      );
    }

    if (ref100Quantity === "0") {
      const coreRevoked: TraceResponse["core"] = {
        policyId: policyIdTrimmed,
        assetName: assetNameTrimmed,
        standard: "Traceability-v1",
        referenceUtxo: null,
        batch: {
          name: "",
          description: null,
          image: null,
          originSiteCode: null,
          minterName: null,
          minterLocation: null,
        },
      };
      return {
        metadata: {},
        properties: {},
        certificateUrl: null,
        lifecycle: { completed: false, checkpointsPassed: [], missingCheckpoints: [] },
        burnStatus: "revoked",
        revoked: true,
        mapData: undefined,
        currentLocation: undefined,
        display: undefined,
        core: coreRevoked,
        route: undefined,
        shipping: undefined,
        inventory: undefined,
      };
    }

    let datumHex: string | null = null;
    let ref100Utxo: Ref100Utxo | undefined;

    if (isSnapshot) {
      const txHashTrim = atTxHash!.trim();
      const tx = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(txHashTrim);
      const outputs = (tx as { outputs?: Array<{ output_index: number; inline_datum?: string; amount?: Array<{ unit: string }> }> })
        ?.outputs ?? [];
      const outWithRef100 = outputs.find(
        (o: { amount?: Array<{ unit: string }> }) =>
          Array.isArray(o?.amount) &&
          o.amount.some((a: { unit: string }) => a.unit === ref100Unit)
      );
      if (!outWithRef100?.inline_datum) {
        throw new NotFoundException(
          "Ref100 datum not found in the specified transaction."
        );
      }
      datumHex = outWithRef100.inline_datum;
      ref100Utxo = undefined;
    } else {
      const holdersRef100 = await this.cardano.blockfrostFetcher.fetchAssetAddresses(
        ref100Unit
      );
      const storeAddress =
        holdersRef100.length > 0 ? holdersRef100[0].address?.trim() : null;
      if (!storeAddress) {
        throw new NotFoundException("Ref100 UTxO not found on chain.");
      }

      const utxosRaw = await this.cardano.blockfrostFetcher.fetchAddressUTXOsAsset(
        storeAddress,
        ref100Unit
      );
      const utxosList = Array.isArray(utxosRaw) ? utxosRaw : [];
      ref100Utxo = utxosList[0] as Ref100Utxo | undefined;
      if (ref100Utxo?.inline_datum) {
        datumHex = ref100Utxo.inline_datum;
      } else if (
        ref100Utxo?.tx_hash != null &&
        ref100Utxo?.output_index != null
      ) {
        const tx = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(
          ref100Utxo.tx_hash
        );
        const outputs = (tx as { outputs?: Array<{ output_index: number; inline_datum?: string }> })
          ?.outputs ?? [];
        const out = outputs.find(
          (o: { output_index: number }) =>
            Number(o.output_index) === Number(ref100Utxo?.output_index)
        );
        datumHex = out?.inline_datum ?? null;
      }
    }

    if (!datumHex) {
      throw new NotFoundException("Ref100 datum not found on chain.");
    }

    const metaRaw = await datumToJson(datumHex, { contain_pk: true });
    const metadataRecord = (
      typeof metaRaw === "object" && metaRaw !== null ? metaRaw : {}
    ) as Record<string, string>;
    const metadata: Record<string, unknown> = { ...metadataRecord };
    const rawReceiverLocations =
      decodeHexToUtf8(metadataRecord.receiver_locations) ||
      metadataRecord.receiver_locations ||
      "";
    const rawMinterLocation =
      decodeHexToUtf8(metadataRecord.minter_location) ||
      metadataRecord.minter_location ||
      "Origin";
    const receiverLocationsArr = rawReceiverLocations
      .split(";")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const standard =
      (metadataRecord.standard as string) || "Traceability-v1";
    const properties: Record<string, unknown> = {};
    const rawExpiry =
      metadataRecord.ngayHetHan ??
      (metadata as Record<string, unknown>).ngayHetHan;
    if (rawExpiry) {
      properties.ngayHetHan = rawExpiry;
    }

    const prefix222 = this.config.cip68Prefix.USER_222;
    const nft222Unit = buildNft222Unit(
      policyIdTrimmed,
      assetNameTrimmed,
      prefix222
    );
    let nft222Quantity = "0";
    try {
      const nft222Asset = (await this.cardano.blockfrostFetcher.fetchSpecificAsset(
        nft222Unit
      )) as { quantity?: string };
      nft222Quantity = nft222Asset?.quantity ?? "0";
    } catch {
      nft222Quantity = "0";
    }
    const burnStatus: "active" | "burned" | "revoked" =
      nft222Quantity === "0" ? "burned" : "active";

    let burnedAtAddress: string | null = null;
    if (burnStatus === "burned") {
      try {
        const txList = (await this.cardano.blockfrostFetcher.fetchAssetTransactions(
          nft222Unit
        )) as Array<{ tx_hash: string }>;
        if (Array.isArray(txList) && txList.length > 0) {
          for (const { tx_hash } of txList) {
            const txUtxos = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(
              tx_hash
            );
            const inputs = (txUtxos as { inputs?: Array<{ address: string; amount?: Array<{ unit: string; quantity: string }> }> })
              ?.inputs ?? [];
            const inputWith222 = inputs.find(
              (inp: { amount?: Array<{ unit: string }> }) =>
                Array.isArray(inp.amount) &&
                inp.amount.some((a: { unit: string }) => a.unit === nft222Unit)
            );
            if (inputWith222 && (inputWith222 as { address?: string }).address) {
              burnedAtAddress = (inputWith222 as { address: string }).address.trim();
              break;
            }
          }
        }
      } catch {
        burnedAtAddress = null;
      }
    }

    let scriptAddress: string | null = null;
    try {
      scriptAddress =
        this.order.getScriptAddress()?.trim().toLowerCase() ?? null;
    } catch {
      scriptAddress = null;
    }

    const referenceUtxo =
      !isSnapshot &&
      ref100Utxo?.tx_hash != null &&
      ref100Utxo?.output_index != null
        ? `${ref100Utxo.tx_hash}#${ref100Utxo.output_index}`
        : null;

    const core: TraceResponse["core"] = {
      policyId: policyIdTrimmed,
      assetName: assetNameTrimmed,
      standard,
      referenceUtxo,
      batch: {
        name: (metadataRecord.name as string) ?? "",
        description: metadataRecord.description ?? null,
        image: metadataRecord.image ?? null,
        originSiteCode:
          metadataRecord.originSiteCode ?? rawMinterLocation ?? null,
        minterName: null,
        minterLocation: rawMinterLocation ?? null,
      },
    };

    const certificateUrl =
      typeof metadataRecord.certificate === "string" && metadataRecord.certificate.trim()
        ? metadataRecord.certificate.trim()
        : null;

    const minterCoords = metadataRecord.minter_coordinates ?? "";
    const receiverCoords = metadataRecord.receiver_coordinates ?? "";
    const minterAddress =
      decodeHexToUtf8(metadataRecord.minter_address) ||
      metadataRecord.minter_address ||
      null;
    const receiverAddressesStr =
      decodeHexToUtf8(metadataRecord.receiver_addresses) ||
      metadataRecord.receiver_addresses ||
      "";
    const receiverAddressesArr = receiverAddressesStr
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const originPoints = parseCoordinates(minterCoords);
    const originPoint = originPoints.length > 0 ? originPoints[0] : null;
    const receiverPoints = parseCoordinates(receiverCoords);

    type CurrentLocation = {
      address: string;
      label: string;
      lat: number | null;
      lng: number | null;
      locationType?: "minter" | "receiver" | "script" | "outside";
      unverified?: boolean;
    };
    let currentLocation: CurrentLocation | undefined;

    if (!isSnapshot && burnStatus === "active") {
      try {
        const holders222 =
          await this.cardano.blockfrostFetcher.fetchAssetAddresses(nft222Unit);
        const holderAddress =
          holders222.length > 0 ? holders222[0].address?.trim() : null;
        if (holderAddress) {
          const holderLower = holderAddress.toLowerCase();
          let label: string;
          let lat: number | null = null;
          let lng: number | null = null;
          let locationType: "minter" | "receiver" | "script" | "outside" =
            "outside";
          const minterLower = minterAddress?.trim().toLowerCase();
          if (minterLower && holderLower === minterLower) {
            label = "Origin (Minter)";
            locationType = "minter";
          } else if (
            receiverAddressesArr.some(
              (a) => a?.trim().toLowerCase() === holderLower
            )
          ) {
            const idx = receiverAddressesArr.findIndex(
              (a) => a?.trim().toLowerCase() === holderLower
            );
            label =
              receiverLocationsArr[idx] != null
                ? `Receiver: ${receiverLocationsArr[idx]}`
                : `Receiver ${idx + 1}`;
            locationType = "receiver";
          } else if (scriptAddress && holderLower === scriptAddress) {
            label = "In transit (locked)";
            locationType = "script";
          } else {
            label = "Wallet";
            locationType = "outside";
          }
          currentLocation = {
            address: holderAddress,
            label,
            lat,
            lng,
            locationType,
          };
        }
      } catch {
      }
    }

    const currentHolderIndex: number | null = (() => {
      if (isSnapshot || burnStatus !== "active" || !currentLocation) return null;
      const holderLower = currentLocation.address.trim().toLowerCase();
      if (!holderLower) return null;
      if (minterAddress && minterAddress.trim().toLowerCase() === holderLower)
        return 0;
      for (let i = 0; i < receiverAddressesArr.length; i++) {
        if (
          receiverAddressesArr[i] &&
          receiverAddressesArr[i].trim().toLowerCase() === holderLower
        )
          return i + 1;
      }
      return null;
    })();

    const addressToPointIndex = (addr: string | null): number | null => {
      if (!addr) return null;
      const lower = addr.trim().toLowerCase();
      if (minterAddress && minterAddress.trim().toLowerCase() === lower) return 0;
      for (let i = 0; i < receiverAddressesArr.length; i++) {
        if (receiverAddressesArr[i]?.trim().toLowerCase() === lower) return i + 1;
      }
      return null;
    };

    const properlyReachedIndices = new Set<number>();
    if (!isSnapshot && burnStatus === "active" && scriptAddress) {
      try {
        const allTxs = await this.cardano.blockfrostFetcher.fetchAllAssetTransactions(nft222Unit);
        const scriptLower = scriptAddress.toLowerCase();
        for (const { tx_hash } of Array.isArray(allTxs) ? allTxs : []) {
          const txUtxos = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(tx_hash);
          const inputs = (txUtxos as { inputs?: Array<{ address: string; amount?: Array<{ unit: string }> }> })?.inputs ?? [];
          const outputs = (txUtxos as { outputs?: Array<{ address?: string; amount?: Array<{ unit: string }> }> })?.outputs ?? [];
          const inputWith222 = inputs.find(
            (inp: { amount?: Array<{ unit: string }> }) =>
              Array.isArray(inp.amount) &&
              inp.amount.some((a: { unit: string }) => a.unit === nft222Unit)
          );
          const outputWith222 = outputs.find(
            (o: { address?: string; amount?: Array<{ unit: string }> }) =>
              Array.isArray(o?.amount) &&
              o.amount.some((a: { unit: string }) => a.unit === nft222Unit)
          );
          const fromAddress = inputWith222?.address?.trim().toLowerCase() ?? null;
          const toAddress = (outputWith222 as { address?: string })?.address?.trim().toLowerCase() ?? null;
          if (!toAddress) continue;
          const toIndex = addressToPointIndex(toAddress);
          if (fromAddress === null && toIndex === 0) {
            properlyReachedIndices.add(0);
          }
          if (fromAddress === scriptLower && toIndex !== null) {
            properlyReachedIndices.add(toIndex);
          }
        }
      } catch {
      }
    }

    let lastInChainIndexFromHistory: number | null = null;
    if (!isSnapshot && burnStatus === "active" && currentLocation?.address) {
      try {
        const txList = (await this.cardano.blockfrostFetcher.fetchAssetTransactions(
          nft222Unit
        )) as Array<{ tx_hash: string }>;
        const toAddressLower = currentLocation.address.trim().toLowerCase();
        for (const { tx_hash } of Array.isArray(txList) ? txList : []) {
          const txUtxos = await this.cardano.blockfrostFetcher.fetchTransactionsUTxO(tx_hash);
          const outputs = (txUtxos as { outputs?: Array<{ address?: string; amount?: Array<{ unit: string }> }> })?.outputs ?? [];
          const outputToHolder = outputs.find(
            (o: { address?: string; amount?: Array<{ unit: string }> }) =>
              o.address?.toLowerCase() === toAddressLower &&
              Array.isArray(o.amount) &&
              o.amount.some((a: { unit: string }) => a.unit === nft222Unit)
          );
          if (!outputToHolder) continue;
          const inputs = (txUtxos as { inputs?: Array<{ address: string; amount?: Array<{ unit: string }> }> })?.inputs ?? [];
          const inputWith222 = inputs.find(
            (inp: { amount?: Array<{ unit: string }> }) =>
              Array.isArray(inp.amount) &&
              inp.amount.some((a: { unit: string }) => a.unit === nft222Unit)
          );
          if (inputWith222?.address) {
            const senderIndex = addressToPointIndex((inputWith222 as { address: string }).address);
            if (senderIndex !== null) lastInChainIndexFromHistory = senderIndex;
            break;
          }
        }
      } catch {
        lastInChainIndexFromHistory = null;
      }
    }

    type MapPoint = {
      lat: number;
      lng: number;
      label: string;
      status: "completed" | "current" | "pending" | "burned" | "in_transit";
      pointType: "origin" | "receiver" | "script" | "outside" | "burned";
      address?: string | null;
    };
    const isInScript = currentLocation?.locationType === "script";
    const burnedAddressLower = burnedAtAddress?.trim().toLowerCase() ?? "";
    const inTransitFromIndex = isInScript ? (lastInChainIndexFromHistory ?? 0) : -1;

    const finalMapData: MapPoint[] = [];
    let pointIndex = 0;
    if (originPoint) {
      const isBurnHere =
        !!burnedAddressLower && minterAddress?.trim().toLowerCase() === burnedAddressLower;
      const status: MapPoint["status"] =
        burnStatus === "burned" && isBurnHere
          ? "burned"
          : isInScript
            ? properlyReachedIndices.has(pointIndex)
              ? "completed"
              : pointIndex === inTransitFromIndex + 1
                ? "in_transit"
                : "pending"
            : properlyReachedIndices.has(pointIndex)
              ? "completed"
              : currentHolderIndex === pointIndex
                ? "current"
                : "pending";
      finalMapData.push({
        lat: originPoint.lat,
        lng: originPoint.lng,
        label: rawMinterLocation || "Origin",
        status,
        pointType: isBurnHere ? "burned" : "origin",
        address: minterAddress ?? undefined,
      });
      pointIndex++;
    }
    receiverPoints.forEach((pt, i) => {
      const addr = receiverAddressesArr[i]?.trim().toLowerCase();
      const isBurnHere = !!burnedAddressLower && addr === burnedAddressLower;
      const status: MapPoint["status"] =
        burnStatus === "burned" && isBurnHere
          ? "burned"
          : isInScript
            ? properlyReachedIndices.has(pointIndex)
              ? "completed"
              : pointIndex === inTransitFromIndex + 1
                ? "in_transit"
                : "pending"
            : properlyReachedIndices.has(pointIndex)
              ? "completed"
              : currentHolderIndex === pointIndex
                ? "current"
                : "pending";
      finalMapData.push({
        lat: pt.lat,
        lng: pt.lng,
        label: receiverLocationsArr[i] ?? `Stop ${i + 1}`,
        status,
        pointType: isBurnHere ? "burned" : "receiver",
        address: receiverAddressesArr[i] ?? undefined,
      });
      pointIndex++;
    });

    const display = buildDisplay(
      metadata,
      properties,
      rawMinterLocation,
      receiverLocationsArr,
      metadataRecord.image ?? null
    );

    return {
      metadata,
      properties,
      certificateUrl: certificateUrl ?? null,
      lifecycle: {
        completed: false,
        checkpointsPassed: [],
        missingCheckpoints: [],
      },
      burnStatus,
      burnedAtAddress: burnedAtAddress ?? undefined,
      mapData: finalMapData.length > 0 ? finalMapData : undefined,
      currentLocation: isSnapshot ? undefined : currentLocation,
      display,
      core,
      route: undefined,
      shipping: undefined,
      inventory: undefined,
      snapshotAtTxHash: isSnapshot ? atTxHash!.trim() : undefined,
    };
  }
}
