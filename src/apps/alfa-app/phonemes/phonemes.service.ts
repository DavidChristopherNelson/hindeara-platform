import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePhonemeDto } from './dto/create-phoneme.dto';
import { UpdatePhonemeDto } from './dto/update-phoneme.dto';
import { Phoneme } from './entities/phoneme.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Injectable()
export class PhonemesService {
  constructor(
    @InjectRepository(Phoneme)
    private phonemeRepository: Repository<Phoneme>,
  ) {}

  @LogMethod()
  async create(createPhonemeDto: CreatePhonemeDto): Promise<Phoneme> {
    const phoneme = this.phonemeRepository.create(createPhonemeDto);
    return this.phonemeRepository.save(phoneme);
  }

  @LogMethod()
  async findAll(): Promise<Phoneme[]> {
    return this.phonemeRepository.find();
  }

  @LogMethod()
  async findOne(id: number): Promise<Phoneme | null> {
    return this.phonemeRepository.findOne({ where: { id } });
  }

  @LogMethod()
  async update(
    id: number,
    updatePhonemeDto: UpdatePhonemeDto,
  ): Promise<Phoneme> {
    const phoneme = await this.findOne(id);
    if (!phoneme) {
      throw new NotFoundException('Phoneme not found');
    }

    Object.assign(phoneme, updatePhonemeDto);
    return this.phonemeRepository.save(phoneme);
  }
}
