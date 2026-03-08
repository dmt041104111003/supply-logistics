import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { CardanoService } from "./cardano.service";
import { Ref100MetadataService } from "./ref100-metadata.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CardanoService, Ref100MetadataService],
  exports: [CardanoService, Ref100MetadataService],
})
export class CardanoModule {}

