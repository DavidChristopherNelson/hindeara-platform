import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PhonemesService } from './phonemes.service';
import { CreatePhonemeDto } from './dto/create-phoneme.dto';
import { UpdatePhonemeDto } from './dto/update-phoneme.dto';
import { Phoneme } from './entities/phoneme.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@ApiTags('phonemes')
@Controller('phonemes')
export class PhonemesController {
  constructor(private readonly phonemesService: PhonemesService) {}

  @Post()
  @ApiBody({ type: CreatePhonemeDto })
  @ApiResponse({
    status: 201,
    description: 'Phoneme successfully created.',
    type: Phoneme,
  })
  @LogMethod()
  async create(@Body() createPhonemeDto: CreatePhonemeDto): Promise<Phoneme> {
    return this.phonemesService.create(createPhonemeDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all phonemes.',
    type: [Phoneme],
  })
  @LogMethod()
  async findAll(): Promise<Phoneme[]> {
    return this.phonemesService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Returns the phoneme with the matching id.',
    type: Phoneme,
  })
  @ApiResponse({ status: 404, description: 'Phoneme not found.' })
  @LogMethod()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Phoneme> {
    const phoneme = await this.phonemesService.findOne(id);
    if (!phoneme) throw new NotFoundException('Phoneme not found');
    return phoneme;
  }

  @Patch(':id')
  @ApiBody({ type: UpdatePhonemeDto })
  @ApiResponse({ status: 200, description: 'Phoneme updated.', type: Phoneme })
  @ApiResponse({ status: 404, description: 'Phoneme not found.' })
  @LogMethod()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePhonemeDto: UpdatePhonemeDto,
  ): Promise<Phoneme> {
    return this.phonemesService.update(id, updatePhonemeDto);
  }
}
