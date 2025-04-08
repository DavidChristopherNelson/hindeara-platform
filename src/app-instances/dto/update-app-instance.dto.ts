import { PartialType } from '@nestjs/mapped-types';
import { CreateAppInstanceDto } from './create-app-instance.dto';

export class UpdateAppInstanceDto extends PartialType(CreateAppInstanceDto) {}
