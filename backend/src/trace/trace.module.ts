import { Module } from "@nestjs/common";
import { TraceController } from "./trace.controller";
import { TraceService } from "./trace.service";
import { OrderModule } from "../order/order.module";
import { ConfigModule } from "../core/config/config.module";
import { CardanoModule } from "../core/cardano/cardano.module";
import { TraceAssetUseCase } from "./application/use-cases/trace-asset.use-case";
import { TraceHistoryUseCase } from "./application/use-cases/trace-history.use-case";

@Module({
  imports: [ConfigModule, CardanoModule, OrderModule],
  controllers: [TraceController],
  providers: [TraceService, TraceAssetUseCase, TraceHistoryUseCase],
})
export class TraceModule {}
