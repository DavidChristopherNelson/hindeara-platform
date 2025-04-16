import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformService {
  getHello(): string {
    return 'Hello World!';
  }
}
