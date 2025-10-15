// src/apps/alfa-app/score/score.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, QueryFailedError, EntityManager } from 'typeorm';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { UserPhonemeScore } from './score.entity';
import { Phoneme } from 'src/apps/alfa-app/phonemes/entities/phoneme.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';
import { PhonemesService } from 'src/apps/alfa-app/phonemes/phonemes.service';
import { INITIAL_SCORES } from './data/initial-scores';

@Injectable()
export class UserPhonemeScoreService {
  constructor(
    @InjectRepository(UserPhonemeScore)
    private readonly repo: Repository<UserPhonemeScore>,
    @InjectRepository(Phoneme)
    private readonly phonemeRepo: Repository<Phoneme>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly ds: DataSource,
    private readonly phonemesService: PhonemesService,
  ) {}
      
  /**
   * Batch insert new phoneme scores for one user.
   * Always creates new rows (append-only, never overwrites).
   * Can participate in an existing transaction if manager is provided.
   */
  @LogMethod()
  async createManyForUser(
    userId: number,
    items: Array<{ phonemeId: number; value: number | string }>,
    manager?: EntityManager,
  ): Promise<void> {
    if (!items.length) return;

    // Normalize items and stringify values to match entity column type
    const toInsert = items.map(({ phonemeId, value }) => ({
      userId,
      phonemeId,
      value: String(value),
    }));

    if (manager) {
      // Use provided transaction manager
      await manager.insert(UserPhonemeScore, toInsert);
    } else {
      // Otherwise run a standalone transaction
      await this.ds.transaction(async (txnManager) => {
        await txnManager.insert(UserPhonemeScore, toInsert);
      });
    }
  }

  /**
   * Return all phonemes for a user with the status and latest score for that phoneme.
   * Uses two lightweight queries (phonemes + scores) and merges in memory.
   */
  @LogMethod()
  async findLatestForUser(
    userId: number,
  ): Promise<Array<{ phonemeId: number; letter: string; value: string; cardReveal: boolean }>> {
    // Get active phonemes
    const phonemes = await this.phonemeRepo.find({
      select: ['id', 'letter'],
      where: { is_active: true },
      order: { id: 'ASC' },
    });

    // Get all scores for this user, sorted newest first
    const scores = await this.repo.find({
      where: { userId },
      select: ['phonemeId', 'value', 'createdAt'],
      order: { phonemeId: 'ASC', createdAt: 'DESC' },
    });

    // Keep only the latest score per phonemeId
    const latestScores = new Map<number, string>();
    for (const s of scores) {
      if (!latestScores.has(s.phonemeId)) {
        latestScores.set(s.phonemeId, s.value);
      }
    }

    // Merge phoneme list with score values
    return phonemes.map((p) => ({
      phonemeId: p.id,
      letter: p.letter,
      value: latestScores.get(p.id) ?? '0',
      cardReveal: this.calculateStatus(p.letter, latestScores.get(p.id)),
    }));
  }

  //@LogMethod()
  private calculateStatus(phonemeLetter: string, currentScore: string | undefined): boolean {
    if (!currentScore) return false;
    const parsedCurrentScore = parseFloat(currentScore);
    for (const s of INITIAL_SCORES) {
      if (phonemeLetter === s.letter) {
        return parsedCurrentScore >= (s.value + 2);
      }
    }
    return parsedCurrentScore >= 2;
  }

  @LogMethod()
  async findAllUser(
    userId: number
  ): Promise<Array<{ phonemeId: number; letter: string; value: string | null; createdAt: Date }>> {
    const raw = await this.repo
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.phoneme', 'phoneme')
      .select(['score.phonemeId', 'phoneme.letter', 'score.value', 'score.createdAt'])
      .where('score.userId = :userId', { userId })
      .orderBy('score.createdAt', 'DESC')
      .getRawMany();

    return raw.map((r) => ({
      phonemeId: r.score_phonemeId,
      letter: r.phoneme_letter,
      value: r.score_value,
      createdAt: r.score_createdAt,
    }));
  }

  @LogMethod()
  async findScoreForUserAndPhoneme(userId: number, phonemeId: number): Promise<UserPhonemeScore | null> {
    return this.repo.findOne({
      where: { userId, phonemeId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Ensure this user has a row for every phoneme (default 0).
   * TypeORM-only: fetch sets and insert missing.
   */
  @LogMethod()
  async ensureUserCoverage(userId: number): Promise<void> {
    const [phonemes, existing] = await Promise.all([
      this.phonemeRepo.find({ select: ['id'] }),
      this.repo.find({ where: { userId }, select: ['phonemeId'] }),
    ]);

    const have = new Set(existing.map((e) => e.phonemeId));
    const toInsert = phonemes
      .filter((p) => !have.has(p.id))
      .map((p) => ({ userId, phonemeId: p.id, value: '0' }));

    if (toInsert.length) {
      await this.repo.insert(toInsert);
    }
  }

  /**
   * Update a user's score for a phoneme based on answer correctness.
   * Accepts either IDs or entity objects for user and phoneme.
   */
  @LogMethod()
  async updateScore(
    user: number | User,
    phoneme: number | Phoneme,
    answerStatus: boolean,
  ): Promise<void> {
    const userId = typeof user === 'number' ? user : user.id;
    const phonemeId = typeof phoneme === 'number' ? phoneme : phoneme.id;
    const averageScore = await this.calculateAverageScore(userId);

    let currentScore = await this.repo.findOne({
      where: { userId, phonemeId },
      select: ['value'],
      order: { createdAt: 'DESC' },
    });

    const scoreDifference = parseFloat(currentScore?.value || '0') - averageScore;
    let increment = 0;
    const randomPerturbation = 0.1;
    if (scoreDifference < 0) {
      if (answerStatus === true) {
        increment = -0.5 * scoreDifference + 1 + randomPerturbation;
      } else {
        increment = 2 * -Math.exp(0.5 * scoreDifference) + randomPerturbation;
      }
    }
    if (scoreDifference >= 0) {
      if (answerStatus === true) {
        increment = Math.exp(-0.5 * scoreDifference) + randomPerturbation;
      } else {
        increment = 2 * -0.5 * scoreDifference - 1 + randomPerturbation;
      }
    }

    const newValue = (parseFloat(currentScore?.value || '0') + increment).toFixed(3);
    await this.repo.insert({
      userId,
      phonemeId,
      value: newValue,
    });
  }

  @LogMethod()
  async calculateAverageScore(userId: number): Promise<number> {
    const scores = await this.repo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: ['phonemeId', 'value', 'updatedAt'],
    });
    
    const latestByPhoneme = new Map<number, number>();
    for (const s of scores) {
      if (!latestByPhoneme.has(s.phonemeId)) {
        latestByPhoneme.set(s.phonemeId, parseFloat(s.value));
      }
    }
    
    const nonIntegerScores = Array.from(latestByPhoneme.values())
      .filter(value => !Number.isInteger(value));
    
    if (nonIntegerScores.length === 0) return 0;
    
    return (
      nonIntegerScores.reduce((sum, v) => sum + v, 0) / nonIntegerScores.length
    );
  }

  /**
   * For every user, set matras (phoneme IDs 2031–2040) to value "2".
   * Skips any phoneme IDs that do not exist.
   * Updates existing rows or inserts if missing.
   */
  @LogMethod()
  async assignInitialPhonemesWeights(
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const initialPhonemeLetters = INITIAL_SCORES;
    const weights: Array<{ phonemeId: number; value: number | string }> = [];
  
    for (const { letter, value } of initialPhonemeLetters) {
      const phoneme = await this.phonemesService.findByLetter(letter);
      if (!phoneme) {
        throw new Error(`Phoneme not found for letter: ${letter}`);
      }
      weights.push({ phonemeId: phoneme.id, value });
    }
  
    await this.createManyForUser(userId, weights, manager);
  }
}
