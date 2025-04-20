import { Injectable } from '@nestjs/common';
import { CreatePhonemeDto } from './dto/create-phoneme.dto';
import { UpdatePhonemeDto } from './dto/update-phoneme.dto';

@Injectable()
export class PhonemeService {
  create(createPhonemeDto: CreatePhonemeDto) {
    return 'This action adds a new phoneme';
  }

  findAll() {
    return `This action returns all phoneme`;
  }

  findOne(id: number) {
    return `This action returns a #${id} phoneme`;
  }

  update(id: number, updatePhonemeDto: UpdatePhonemeDto) {
    return `This action updates a #${id} phoneme`;
  }

  remove(id: number) {
    return `This action removes a #${id} phoneme`;
  }
}
