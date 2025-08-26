// src/apps/alfa-app/phonemes/phonemes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePhonemeDto } from './dto/create-phoneme.dto';
import { UpdatePhonemeDto } from './dto/update-phoneme.dto';
import { Phoneme } from './entities/phoneme.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { ENGLISH_PHONEMES } from './data/english-phonemes';
import { HINDI_PHONEMES } from './data/hindi-phonemes';
import { In } from 'typeorm';

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
  async findByLetter(letter: string): Promise<Phoneme | null> {
    const letterUpperCase = letter.toUpperCase();
    const phoneme = await this.phonemeRepository.findOne({
      where: { letter: letterUpperCase },
    });
    return phoneme;
  }

  @LogMethod()
  async getImage(letter: string | undefined): Promise<string | undefined> {
    if (!letter) {
      return undefined;
    }
    const phoneme = await this.findByLetter(letter);
    return phoneme?.example_image ?? undefined;
  }

  @LogMethod()
  async getNoun(letter: string | undefined): Promise<string | undefined> {
    if (!letter) {
      return undefined;
    }
    const phoneme = await this.findByLetter(letter);
    return phoneme?.example_noun ?? undefined;
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

  @LogMethod()
  async seedEnglishAlphabet(): Promise<Phoneme[]> {
    // Upsert by unique key 'letter'
    await this.phonemeRepository.upsert(ENGLISH_PHONEMES, {
      conflictPaths: ['letter'],
      skipUpdateIfNoValuesChanged: true,
    });

    // Return the affected entities
    const letters = ENGLISH_PHONEMES.map((p) => p.letter.toUpperCase());
    return this.phonemeRepository.find({ where: { letter: In(letters) } });
  }

  @LogMethod()
  async seedHindiAlphabet(): Promise<Phoneme[]> {
    // Upsert by unique key 'letter'
    await this.phonemeRepository.upsert(HINDI_PHONEMES, {
      conflictPaths: ['letter'],
      skipUpdateIfNoValuesChanged: true,
    });

    // Return the affected entities
    const letters = HINDI_PHONEMES.map((p) => p.letter.toUpperCase());
    return this.phonemeRepository.find({ where: { letter: In(letters) } });
  }
}
