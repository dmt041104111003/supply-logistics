import { Controller, Get, Post, Body, Query, Param, BadRequestException, UseGuards } from "@nestjs/common";
import { ProductService } from "./product.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import {
  MintProductDto,
  UpdateProductDto,
  RevokeProductDto,
  BurnProductDto,
  MintConfirmDto,
  UpdateConfirmDto,
  SubmitTxDto,
} from "./dto/product.dto";

@Controller("product")
export class ProductController {
  constructor(
    private readonly product: ProductService,
  ) {}

  @Get("batches")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async listBatches(
    @CurrentUser() user: AuthUser,
  ): Promise<{
    total: number;
    items: { id: number; batchId: string; name: string; description: string | null; image: string | null; certificate: string | null; createdAt: Date; policyId: string | null; sku: string | null; grossWeightKg: number | null; netWeightKg: number | null; originSiteCode: string | null; canUpdate: boolean }[];
  }> {
    const items = await this.product.listBatches(user.profileId);
    return { total: items.length, items };
  }

  @Post("mint")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async mint(
    @Body() body: MintProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ unsignedTx: string; policyId?: string }> {
    if (!body.changeAddress || !body.assetName) {
      throw new BadRequestException("Missing changeAddress or assetName");
    }
    if (!body.metadata && (
      !body.name ||
      !body.image ||
      !body.receivers?.length ||
      !body.receiverLocations ||
      !body.receiverCoordinates ||
      !body.minterLocation ||
      !body.minterCoordinates
    )) {
      throw new BadRequestException(
        "Missing metadata or (name, image, receivers, receiverLocations, receiverCoordinates, minterLocation, minterCoordinates)",
      );
    }
    return this.product.mint({
      changeAddress: body.changeAddress,
      assetName: body.assetName,
      metadata: body.metadata,
      receiver: body.receiver,
      name: body.name,
      image: body.image,
      receivers: body.receivers,
      receiverLocations: body.receiverLocations,
      receiverCoordinates: body.receiverCoordinates,
      minterLocation: body.minterLocation,
      minterCoordinates: body.minterCoordinates,
      propertiesJson: body.propertiesJson,
      certificate: body.certificate,
      walletUtxos: body.walletUtxos as any,
      utxoAddresses: body.utxoAddresses,
    });
  }

  @Post("update")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async update(
    @Body() body: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ unsignedTx: string }> {
    if (!body.changeAddress || !body.assetName) {
      throw new BadRequestException("Missing changeAddress or assetName");
    }
    if (!body.metadata && (
      !body.name ||
      !body.image ||
      !body.receivers?.length ||
      !body.receiverLocations ||
      !body.receiverCoordinates ||
      !body.minterLocation ||
      !body.minterCoordinates
    )) {
      throw new BadRequestException(
        "Missing metadata or (name, image, receivers, receiverLocations, receiverCoordinates, minterLocation, minterCoordinates)",
      );
    }
    return this.product.update({
      changeAddress: body.changeAddress,
      assetName: body.assetName,
      txHash: body.txHash,
      metadata: body.metadata,
      name: body.name,
      image: body.image,
      receivers: body.receivers,
      receiverLocations: body.receiverLocations,
      receiverCoordinates: body.receiverCoordinates,
      minterLocation: body.minterLocation,
      minterCoordinates: body.minterCoordinates,
      propertiesJson: body.propertiesJson,
      certificate: body.certificate,
      walletUtxos: body.walletUtxos as any,
      utxoAddresses: body.utxoAddresses,
    });
  }

  @Post("revoke")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async revoke(
    @Body() body: RevokeProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ unsignedTx: string }> {
    if (!body.changeAddress || !body.assetName) {
      throw new BadRequestException("Missing changeAddress or assetName");
    }
    return this.product.revoke({
      changeAddress: body.changeAddress,
      assetName: body.assetName,
      txHash: body.txHash,
      walletUtxos: body.walletUtxos as any,
      utxoAddresses: body.utxoAddresses,
    });
  }

  @Post("burn")
  async burn(
    @Body() body: BurnProductDto,
  ): Promise<{ unsignedTx: string }> {
    if (!body.changeAddress || !body.assetName) {
      throw new BadRequestException("Missing changeAddress or assetName");
    }
    return this.product.burn({
      changeAddress: body.changeAddress,
      assetName: body.assetName,
      txHash: body.txHash,
      policyId: body.policyId,
      walletUtxos: body.walletUtxos as any,
      utxoAddresses: body.utxoAddresses,
    });
  }

  @Post("mint/confirm")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async mintConfirm(
    @Body() body: MintConfirmDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ ok: boolean }> {
    if (!body.txHash || !body.assetName || !body.name || body.minterProfileId == null) {
      throw new BadRequestException("Missing txHash, assetName, name or minterProfileId");
    }
    await this.product.recordTx({
      action: "MINT",
      txHash: body.txHash,
      assetName: body.assetName,
      profileId: body.minterProfileId,
      name: body.name,
      description: body.description,
      image: body.image ?? "",
      certificate: body.certificate,
      standard: body.standard,
      properties: body.properties,
      metadata: body.metadata,
      policyId: body.policyId,
      receivers: body.receivers,
    });
    return { ok: true };
  }

  @Post("update/confirm")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async updateConfirm(
    @Body() body: UpdateConfirmDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ ok: boolean }> {
    if (!body.txHash || !body.assetName || body.profileId == null) {
      throw new BadRequestException("Missing txHash, assetName or profileId");
    }
    await this.product.recordTx({
      action: "UPDATE",
      txHash: body.txHash,
      assetName: body.assetName,
      profileId: body.profileId,
      name: body.name,
      description: body.description,
      image: body.image,
      certificate: body.certificate,
      standard: body.standard,
      properties: body.properties,
      metadata: body.metadata,
      receivers: body.receivers,
    });
    return { ok: true };
  }

  @Post("submit")
  async submit(
    @Body() body: SubmitTxDto,
  ): Promise<{ txHash: string }> {
    const raw = body.signedTxBase64 ?? body.signedTx;
    if (!raw || typeof raw !== "string") {
      throw new BadRequestException("Missing signedTx or signedTxBase64");
    }
    return this.product.submitSignedTx(
      raw,
      !!body.signedTxBase64,
      body.deleteBatchOnSuccess,
    );
  }

  @Get("roadmap")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ENTERPRISE")
  async getRoadmap(
    @Query("code") code: string | undefined,
    @CurrentUser() user: AuthUser,
  ): Promise<{ items: { stepIndex: number; toAddress: string | null }[] }> {
    if (!code || typeof code !== "string" || !code.trim()) {
      return { items: [] };
    }
    const items = await this.product.listRoadmap(code.trim());
    return { items };
  }

  @Get("batch/:code/qr-payload")
  async getBatchQrPayload(
    @Param("code") code: string,
  ): Promise<{ policyId: string; assetName: string; minter: string | null; owners: string[] }> {
    if (!code || typeof code !== "string" || !code.trim()) {
      throw new BadRequestException("code is required");
    }
    return this.product.getBatchQrPayload(code.trim());
  }

  @Get("batch/:code")
  async getBatchByCode(
    @Param("code") code: string,
  ): Promise<{ policyId: string | null; assetName: string; nftUnit: string | null }> {
    if (!code || typeof code !== "string" || !code.trim()) {
      throw new BadRequestException("code is required");
    }
    return this.product.getBatchSummaryByCode(code.trim());
  }
}
