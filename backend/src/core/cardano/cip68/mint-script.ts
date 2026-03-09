import {
  applyParamsToScript,
  deserializeAddress,
  mPubKeyAddress,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import { ConfigService } from "../../config/config.service";

export function computeMintScriptCborForMinterAddress(
  minterChangeAddress: string
): { mintScriptCbor: string; policyId: string } {
  const config = new ConfigService();
  const plutus = config.getPlutus();
  const networkId = config.appNetworkId;
  const t = config.validatorTitle;

  const addr = deserializeAddress(minterChangeAddress);
  const pubKeyIssuer = addr.pubKeyHash;
  const stakeCredentialHash = addr.stakeCredentialHash;
  if (!pubKeyIssuer || !stakeCredentialHash) {
    throw new Error("Invalid minterChangeAddress: missing payment or stake credential hash.");
  }

  const readValidator = (title: string): string => {
    const v = plutus.validators.find((vv) => vv.title === title);
    if (!v) throw new Error(`${title} validator not found.`);
    return v.compiledCode;
  };

  const storeCompileCode = readValidator(t.store);
  const ownerAddress = mPubKeyAddress(pubKeyIssuer, stakeCredentialHash);
  const storeScriptCbor = applyParamsToScript(
    storeCompileCode,
    [[ownerAddress]],
    "Mesh"
  );
  const storeScript = { code: storeScriptCbor, version: "V3" as const };
  const storeScriptAddress = serializePlutusScript(
    storeScript,
    undefined,
    networkId,
    false
  ).address;
  const storeScriptHash = deserializeAddress(storeScriptAddress).scriptHash;

  const storeAddressForMint = mPubKeyAddress(
    storeScriptHash,
    stakeCredentialHash
  );

  const mintCompileCode = readValidator(t.mint);
  const mintScriptCbor = applyParamsToScript(
    mintCompileCode,
    [[ownerAddress], storeAddressForMint],
    "Mesh"
  );

  const policyId = resolveScriptHash(mintScriptCbor, "V3");
  return { mintScriptCbor, policyId };
}

