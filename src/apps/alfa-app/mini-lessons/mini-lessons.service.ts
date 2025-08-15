import { Injectable } from '@nestjs/common';
import { CreateMiniLessonDto } from './dto/create-mini-lesson.dto';
import { MiniLesson } from './entities/mini-lesson.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEvent } from 'src/hindeara-platform/app-events/entities/app-event.entity';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { PhonemesService } from '../phonemes/phonemes.service';

@Injectable()
export class MiniLessonsService {
  constructor(
    @InjectRepository(MiniLesson)
    private miniLessonRepository: Repository<MiniLesson>,
    private readonly phonemesService: PhonemesService,
  ) {}

  @LogMethod()
  async create(createMiniLessonDto: CreateMiniLessonDto): Promise<MiniLesson> {
    const miniLesson = this.miniLessonRepository.create(createMiniLessonDto);
    return this.miniLessonRepository.save(miniLesson);
  }

  @LogMethod()
  async findAll(): Promise<MiniLesson[]> {
    return this.miniLessonRepository.find();
  }

  @LogMethod()
  async findOne(id: number): Promise<MiniLesson | null> {
    return this.miniLessonRepository.findOne({ where: { id } });
  }

  @LogMethod()
  async findMostRecentNByUserId(
    userId: number,
    n: number,
    locale?: string,
  ): Promise<MiniLesson[]> {
    return this.miniLessonRepository.find({
      where: { userId, locale },
      take: n,
    });
  }

  @LogMethod()
  async remove(id: number): Promise<void> {
    await this.miniLessonRepository.delete(id);
  }

  @LogMethod()
  async findLatestMiniLesson(
    secondLatestAppEvent: AppEvent | undefined,
    userId: number,
  ): Promise<MiniLesson> {
    // Handle initial startup edge cases
    if (!secondLatestAppEvent) {
      return this.findEarliestByUserId(userId);
    }

    // Handle normal case
    return this.findByAppEventId(secondLatestAppEvent.id);
  }

  async findEarliestByUserId(userId: number): Promise<MiniLesson> {
    const miniLesson = await this.miniLessonRepository.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    if (!miniLesson) {
      throw new Error('No miniLesson found. This should not happen.');
    }
    return miniLesson;
  }

  async findByAppEventId(appEventId: number): Promise<MiniLesson> {
    const miniLesson = await this.miniLessonRepository.findOne({
      where: { appEventId },
    });
    if (!miniLesson) {
      throw new Error('No miniLesson found.');
    }
    return miniLesson;
  }

  @LogMethod()
  async findAllWordsByUserIdAndLocale(
    userId: number,
    locale: string,
  ): Promise<string[]> {
    const result: { word: string }[] = await this.miniLessonRepository
      .createQueryBuilder('mini')
      .select('DISTINCT mini.word', 'word')
      .where('mini.userId = :userId', { userId })
      .andWhere('mini.locale = :locale', { locale })
      .orderBy('mini.word', 'ASC')
      .getRawMany();
    return result.map((row) => row.word);
  }

  @LogMethod()
  async findAllLettersByUserIdAndLocale(
    userId: number,
    locale: string,
  ): Promise<string[]> {
    const words = await this.findAllWordsByUserIdAndLocale(userId, locale);

    const learntLetters = new Set<string>();
    for (const letter of words.join('')) {
      // Check for matching phoneme.
      if (
        !(await this.phonemesService.findByLetter(
          letter.toLocaleLowerCase(locale),
        ))
      )
        continue;
      learntLetters.add(letter.toLocaleLowerCase(locale));
    }

    return Array.from(learntLetters).sort((a, b) => a.localeCompare(b, locale));
  }
}
