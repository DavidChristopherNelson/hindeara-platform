import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PhonemesService } from './phonemes.service';
import { CreatePhonemeDto } from './dto/create-phoneme.dto';
import { UpdatePhonemeDto } from './dto/update-phoneme.dto';

@Controller('phonemes')
export class PhonemesController {
  constructor(private readonly phonemesService: PhonemesService) {}

  @Post()
  create(@Body() createPhonemeDto: CreatePhonemeDto) {
    return this.phonemesService.create(createPhonemeDto);
  }

  @Get()
  findAll() {
    return this.phonemesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.phonemesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhonemeDto: UpdatePhonemeDto) {
    return this.phonemesService.update(+id, updatePhonemeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phonemesService.remove(+id);
  }
}
