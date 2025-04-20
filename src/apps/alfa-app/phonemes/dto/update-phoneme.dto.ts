import { PickType } from '@nestjs/mapped-types';
import { PhonemeDto } from './phoneme.dto';

export class UpdatePhonemeDto extends PickType(PhonemeDto, [
  'isActive',
] as const) {}
