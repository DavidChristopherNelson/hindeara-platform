import { PartialType } from '@nestjs/mapped-types';
import { CreateAppEventDto } from './create-app-event.dto';

export class UpdateAppEventDto extends PartialType(CreateAppEventDto) {}
