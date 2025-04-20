import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PhonemeService } from './phoneme.service';
import { CreatePhonemeDto } from './dto/create-phoneme.dto';
import { UpdatePhonemeDto } from './dto/update-phoneme.dto';

@Controller('phoneme')
export class PhonemeController {
  constructor(private readonly phonemeService: PhonemeService) {}

  @Post()
  create(@Body() createPhonemeDto: CreatePhonemeDto) {
    return this.phonemeService.create(createPhonemeDto);
  }

  @Get()
  findAll() {
    return this.phonemeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.phonemeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhonemeDto: UpdatePhonemeDto) {
    return this.phonemeService.update(+id, updatePhonemeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phonemeService.remove(+id);
  }
}
