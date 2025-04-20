import { Controller } from '@nestjs/common';
import { InterfaceService } from './interface.service';

@Controller('interface')
export class InterfaceController {
  constructor(private readonly interfaceService: InterfaceService) {}
}
