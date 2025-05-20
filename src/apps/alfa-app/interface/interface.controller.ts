import { Controller } from '@nestjs/common';
import { AlfaAppInterfaceService } from './interface.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('interfaces')
@Controller('interface')
export class InterfaceController {
  constructor(private readonly interfaceService: AlfaAppInterfaceService) {}
}
