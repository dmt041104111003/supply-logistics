import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from "@nestjs/common";
import { OrderService } from "./order.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import {
  BuildLockTxDto,
  BuildUnlockTxDto,
  ParseDatumDto,
  MergePartialTxDto,
  OrderConfirmDto,
  OrderCompleteDto,
  SavePartialTxDto,
} from "./dto/order.dto";

@Controller("order")
export class OrderController {
  constructor(
    private readonly order: OrderService,
  ) {}

  @Get("script-address")
  getScriptAddress(): { scriptAddress: string } {
    return { scriptAddress: this.order.getScriptAddress() };
  }

  @Get("script-utxos")
  async getScriptUtxos(
    @Query("scriptAddress") scriptAddress?: string,
  ): Promise<{ utxos: unknown[] }> {
    const utxos = await this.order.getScriptUtxos(scriptAddress);
    return { utxos };
  }

  @Get("script-utxo-by-asset")
  async getScriptUtxoByAsset(
    @Query("policyId") policyId?: string,
    @Query("assetName") assetName?: string,
    @Query("scriptAddress") scriptAddress?: string,
  ): Promise<{ utxo: unknown | null }> {
    if (!policyId?.trim() || !assetName?.trim()) {
      throw new BadRequestException("Missing policyId or assetName.");
    }
    const utxo = await this.order.getScriptUtxoByAsset(
      policyId.trim(),
      assetName.trim(),
      scriptAddress?.trim() || undefined,
    );
    return { utxo };
  }

  @Post("parse-datum")
  async parseDatum(
    @Body() body: ParseDatumDto,
  ): Promise<{
    ownersPkh: string[];
    threshold: number;
    recipientPkh: string;
    recipientAddress: string;
    ownerAddresses: string[];
  }> {
    if (!body.scriptUtxo?.input || !body.scriptUtxo?.output) {
      throw new BadRequestException("Missing scriptUtxo (input + output).");
    }
    return this.order.parseDatumFromUtxo(body.scriptUtxo);
  }

  @Post("build-lock-tx")
  async buildLockTx(@Body() body: BuildLockTxDto): Promise<{ unsignedTx: string; scriptAddress: string }> {
    if (
      !body.scriptAddress ||
      !body.ownersPkh?.length ||
      body.threshold == null ||
      !body.recipientPkh ||
      !body.assets?.length ||
      !body.changeAddress ||
      !body.utxos?.length
    ) {
      throw new BadRequestException(
        "Missing scriptAddress, ownersPkh, threshold, recipientPkh, assets, changeAddress or utxos.",
      );
    }
    const unsignedTx = await this.order.buildLockTx({
      scriptAddress: body.scriptAddress,
      ownersPkh: body.ownersPkh,
      threshold: body.threshold,
      recipientPkh: body.recipientPkh,
      assets: body.assets,
      changeAddress: body.changeAddress,
      utxos: body.utxos,
    });
    return {
      unsignedTx,
      scriptAddress: body.scriptAddress,
    };
  }

  @Post("confirm")
  async confirmOrder(@Body() body: OrderConfirmDto): Promise<{ id: number }> {
    if (!body.lockTxHash?.trim() || !body.batchId?.trim() || !body.recipientAddress?.trim()) {
      throw new BadRequestException("Missing lockTxHash, batchId or recipientAddress.");
    }
    if (!body.senderAddress?.trim()) {
      throw new BadRequestException("Missing senderAddress.");
    }
    if (!Array.isArray(body.ownerAddresses)) {
      throw new BadRequestException("ownerAddresses must be an array.");
    }
    return this.order.recordOrder({
      lockTxHash: body.lockTxHash,
      scriptOutputIndex: body.scriptOutputIndex ?? 0,
      batchId: body.batchId,
      policyId: body.policyId,
      recipientAddress: body.recipientAddress,
      senderAddress: body.senderAddress,
      ownerAddresses: body.ownerAddresses,
      scriptAddress: body.scriptAddress,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TRANSIT", "AGENT", "SHIPPER")
  @Get("deliveries")
  async getDeliveries(
    @CurrentUser() user?: AuthUser,
  ): Promise<{
    deliveries: {
      id: number;
      lockTxHash: string;
      scriptOutputIndex: number;
      batchId: string;
      policyId: string | null;
      recipientAddress: string;
      senderAddress: string;
      ownerAddresses: string[];
      status: string;
      partialSignedTxHex: string | null;
      partialSignedByAddress: string | null;
      secondSignedByAddress: string | null;
      unlockTxHash: string | null;
      outAt: string | null;
    }[];
  }> {
    const deliveries = await this.order.listOrdersForProfile(user!.profileId);
    return {
      deliveries: deliveries.map((d) => ({
        ...d,
        outAt: d.outAt ? d.outAt.toISOString() : null,
      })),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("TRANSIT", "AGENT", "SHIPPER")
  @Post("deliveries/:id/save-partial-tx")
  async savePartialTx(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SavePartialTxDto,
  ): Promise<{ ok: boolean }> {
    const deliveryId = Number(id);
    if (!Number.isInteger(deliveryId) || deliveryId < 1) {
      throw new BadRequestException("Invalid delivery id.");
    }
    if (!body.partialTxHex?.trim()) {
      throw new BadRequestException("Missing partialTxHex.");
    }
    return this.order.savePartialSignedTx(deliveryId, user.profileId, body.partialTxHex.trim());
  }

  @Post("build-unlock-tx")
  async buildUnlockTx(
    @Body() body: BuildUnlockTxDto,
  ): Promise<{ unsignedTx: string }> {
    if (
      !body.scriptUtxo?.input ||
      !body.scriptUtxo?.output ||
      !body.outputAddress ||
      !body.signingOwnersPkh?.length ||
      body.threshold == null ||
      !body.collateral?.input ||
      !body.changeAddress ||
      !body.utxos
    ) {
      throw new BadRequestException(
        "Missing scriptUtxo, outputAddress, signingOwnersPkh, threshold, collateral, changeAddress or utxos.",
      );
    }
    if (body.signingOwnersPkh.length < body.threshold) {
      throw new BadRequestException(
        `signingOwnersPkh.length (${body.signingOwnersPkh.length}) < threshold (${body.threshold}).`,
      );
    }
    const unsignedTx = await this.order.buildUnlockTx({
      scriptUtxo: body.scriptUtxo,
      outputAddress: body.outputAddress,
      signingOwnersPkh: body.signingOwnersPkh,
      threshold: body.threshold,
      collateral: body.collateral,
      changeAddress: body.changeAddress,
      utxos: body.utxos,
    });
    return { unsignedTx };
  }

  @Post("merge-partial-tx")
  mergePartialTx(
    @Body() body: MergePartialTxDto,
  ): { mergedTxHex: string; witnessCount: number; requiredSigners: string[] } {
    if (!body.partialTxHex || !body.secondSignerResultHex) {
      throw new BadRequestException(
        "Missing partialTxHex or secondSignerResultHex.",
      );
    }
    return this.order.mergePartialTx(
      body.partialTxHex,
      body.secondSignerResultHex,
    );
  }

  @Get("inspect-tx")
  inspectTx(
    @Query("txHex") txHex?: string,
  ): { requiredSigners: string[]; witnessCount: number } {
    if (!txHex?.trim()) {
      throw new BadRequestException("Missing query txHex.");
    }
    return this.order.inspectTx(txHex);
  }

  @Post("complete")
  async completeOrder(
    @Body() body: OrderCompleteDto,
  ): Promise<{ ok: boolean; recipientAddress?: string }> {
    if (!body.unlockTxHash?.trim()) {
      throw new BadRequestException("Missing unlockTxHash.");
    }
    if (typeof body.witnessCount !== "number" || body.witnessCount < 2) {
      throw new BadRequestException("witnessCount is required and must be >= 2.");
    }
    return this.order.confirmOrderComplete({
      unlockTxHash: body.unlockTxHash,
      witnessCount: body.witnessCount,
      signedByAddress: body.signedByAddress?.trim() || undefined,
      deliveryId: body.deliveryId,
    });
  }
}
