// src/apps/alfa-app/score/score.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, QueryFailedError } from 'typeorm';
import { LogMethod } from 'src/common/decorators/log-method.decorator';
import { UserPhonemeScore } from './score.entity';
import { Phoneme } from 'src/apps/alfa-app/phonemes/entities/phoneme.entity';
import { User } from 'src/hindeara-platform/users/entities/user.entity';

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
  ) {}

  /**
   * Canonical TypeORM style: find -> save
   * Concurrency-safe via retry on unique violation (PG code 23505).
   */
  @LogMethod()
  async createOrUpdate(
    userId: number,
    phonemeId: number,
    value: number | string,
  ): Promise<void> {
    const v = String(value);

    const existing = await this.repo.findOne({ where: { userId, phonemeId } });
    if (existing) {
      if (existing.value !== v) {
        existing.value = v;
        await this.repo.save(existing);
      }
      return;
    }

    try {
      const created = this.repo.create({ userId, phonemeId, value: v });
      await this.repo.save(created);
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        const driverErr = err.driverError as { code?: string } | undefined;
        if (driverErr?.code === '23505') {
          const afterRace = await this.repo.findOne({
            where: { userId, phonemeId },
          });
          if (afterRace) {
            if (afterRace.value !== v) {
              afterRace.value = v;
              await this.repo.save(afterRace);
            }
            return;
          }
        }
      }
      throw err;
    }
  }

  /**
   * Batch create/update for one user.
   * One read, then save() updates and insert() new rows inside a txn.
   */
  @LogMethod()
  async createOrUpdateManyForUser(
    userId: number,
    items: Array<{ phonemeId: number; value: number | string }>,
  ): Promise<void> {
    if (!items.length) return;

    await this.ds.transaction(async (manager) => {
      const ids = Array.from(new Set(items.map((i) => i.phonemeId)));
      const existing = await manager.find(UserPhonemeScore, {
        where: { userId, phonemeId: In(ids) },
        select: ['id', 'phonemeId', 'value'],
      });

      const byPid = new Map<number, UserPhonemeScore>();
      for (const row of existing) byPid.set(row.phonemeId, row);

      const toUpdate: UserPhonemeScore[] = [];
      const toInsert: Array<
        Pick<UserPhonemeScore, 'userId' | 'phonemeId' | 'value'>
      > = [];

      for (const { phonemeId, value } of items) {
        const v = String(value);
        const found = byPid.get(phonemeId);
        if (found) {
          if (found.value !== v) {
            found.value = v;
            toUpdate.push(found);
          }
        } else {
          toInsert.push({ userId, phonemeId, value: v });
        }
      }

      if (toUpdate.length) {
        await manager.save(UserPhonemeScore, toUpdate);
      }
      if (toInsert.length) {
        // Ignore occasional races; if you want strictness, wrap in try/catch as in createOrUpdate
        await manager.insert(UserPhonemeScore, toInsert);
      }
    });
  }

  /**
   * Return all phonemes with the user's score (null if missing) WITHOUT raw SQL.
   * Strategy: two lightweight queries then merge in memory.
   */
  @LogMethod()
  async findAllForUser(
    userId: number,
  ): Promise<
    Array<{ phonemeId: number; letter: string; value: string | null }>
  > {
    const [phonemes, scores] = await Promise.all([
      this.phonemeRepo.find({
        select: ['id', 'letter'],
        order: { id: 'ASC' },
      }),
      this.repo.find({
        where: { userId },
        select: ['phonemeId', 'value'],
      }),
    ]);

    const scoreByPid = new Map<number, string>();
    for (const s of scores) scoreByPid.set(s.phonemeId, s.value);

    return phonemes.map((p) => ({
      phonemeId: p.id,
      letter: p.letter,
      value: scoreByPid.get(p.id) ?? null,
    }));
  }

  @LogMethod()
  async findScoreForUserAndPhoneme(userId: number, phonemeId: number): Promise<UserPhonemeScore | null> {
    return this.repo.findOne({ where: { userId, phonemeId } });
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
   * Initialize all (user × phoneme) pairs to 0—TypeORM-only.
   * NOTE: If your user/phoneme tables are very large, consider doing this in batches.
   */
  @LogMethod()
  async initializeAllPairsZero(): Promise<void> {
    const [users, phonemes, existing] = await Promise.all([
      this.userRepo.find({ select: ['id'] }),
      this.phonemeRepo.find({ select: ['id'] }),
      this.repo.find({ select: ['userId', 'phonemeId'] }),
    ]);

    const existingKeys = new Set(
      existing.map((e) => `${e.userId}:${e.phonemeId}`),
    );
    const toInsert: Array<
      Pick<UserPhonemeScore, 'userId' | 'phonemeId' | 'value'>
    > = [];

    for (const u of users) {
      for (const p of phonemes) {
        const k = `${u.id}:${p.id}`;
        if (!existingKeys.has(k)) {
          toInsert.push({ userId: u.id, phonemeId: p.id, value: '0' });
        }
      }
    }

    if (!toInsert.length) return;

    // Chunk to avoid large single statements
    const CHUNK = 1000;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      await this.repo.insert(slice);
    }
  }

  @LogMethod()
  async removeForUser(userId: number, phonemeId: number): Promise<void> {
    await this.repo.delete({ userId, phonemeId });
  }

  @LogMethod()
  async removeAllForUser(userId: number): Promise<void> {
    await this.repo.delete({ userId });
  }

  /**
   * Reset all phoneme scores for a user to zero.
   */
  @LogMethod()
  async resetAllForUser(userId: number): Promise<void> {
    await this.repo.update({ userId }, { value: '0' });
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

    const existingScore = await this.repo.findOne({
      where: { userId, phonemeId },
      select: ['id', 'value'],
    });

    const currentValue = existingScore?.value
      ? parseFloat(existingScore.value)
      : 0;
    const increment = answerStatus ? 1.2 : -2;
    const newValue = (currentValue + increment).toFixed(3);

    await this.createOrUpdate(userId, phonemeId, newValue);
  }
}
