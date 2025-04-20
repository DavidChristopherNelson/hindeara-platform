import { Controller } from '@nestjs/common';
import { PhonemesService } from './phonemes.service';

@Controller('phonemes')
export class PhonemesController {
  constructor(private readonly phonemesService: PhonemesService) {}
}
