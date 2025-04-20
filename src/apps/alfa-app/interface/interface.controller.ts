import { Controller } from '@nestjs/common';
import { AlfaAppInterfaceService } from './interface.service';

@Controller('interface')
export class InterfaceController {
  constructor(private readonly interfaceService: AlfaAppInterfaceService) {}
}
