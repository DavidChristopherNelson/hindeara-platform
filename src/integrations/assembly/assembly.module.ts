import { Module } from '@nestjs/common';
import { AssemblyService } from './assembly.service';

@Module({
  providers: [AssemblyService],
  exports: [AssemblyService],
})
export class AssemblyModule {}
