import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { CreateRecordingDto } from './dto/create-recording.dto';

@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post()
  create(@Body() createRecordingDto: CreateRecordingDto) {
    return this.recordingsService.create(createRecordingDto);
  }

  @Get()
  findAll() {
    return this.recordingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recordingsService.findOne(+id);
  }
}
