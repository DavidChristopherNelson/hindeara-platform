import { PartialType } from '@nestjs/mapped-types';
import { CreatePhonemeDto } from './create-phoneme.dto';

export class UpdatePhonemeDto extends PartialType(CreatePhonemeDto) {}
