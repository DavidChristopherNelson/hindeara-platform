import { Injectable } from '@nestjs/common';
import { CreateRecordingDto } from './dto/create-recording.dto';

@Injectable()
export class RecordingsService {
  create(createRecordingDto: CreateRecordingDto) {
    return 'This action adds a new recording';
  }

  findAll() {
    return `This action returns all recordings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recording`;
  }
}
