import { PartialType } from '@nestjs/mapped-types';
import { CreateHindearaEventDto } from './create-hindeara-event.dto';

export class UpdateHindearaEventDto extends PartialType(CreateHindearaEventDto) {}
