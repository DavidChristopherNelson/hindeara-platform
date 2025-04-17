import { Controller, Get } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  getHello(): string {
    return this.platformService.getHello();
  }
}
