import { PickType } from '@nestjs/mapped-types';
import { CreateAppDto } from './create-app.dto';

export class UpdateAppDto extends PickType(CreateAppDto, [
  'is_active',
] as const) {}
