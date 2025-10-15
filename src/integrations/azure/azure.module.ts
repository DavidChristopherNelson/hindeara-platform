// src/integrations/azure/azure.module.ts

import { Module } from '@nestjs/common';
import { AzureSttService } from './azure.service';

@Module({
  providers: [AzureSttService],
  exports: [AzureSttService],
})
export class AzureModule {}
