// test/platform.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { PlatformModule } from '../src/hindeara-platform/platform/platform.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../src/hindeara-platform/users/entities/user.entity';
import { UserEvent } from '../src/hindeara-platform/user-events/entities/user-event.entity';
import { AppEvent } from '../src/hindeara-platform/app-events/entities/app-event.entity';
import { MiniLesson } from '../src/apps/alfa-app/mini-lessons/entities/mini-lesson.entity';
import { Phoneme } from 'src/apps/alfa-app/phonemes/entities/phoneme.entity';
import { Server } from 'http';
import { createActor } from 'xstate';
import { lessonMachine } from 'src/apps/alfa-app/state/state.machine';
import { App } from 'src/hindeara-platform/apps/entities/app.entity';
import { PhonemesModule } from 'src/apps/alfa-app/phonemes/phonemes.module';
import { PhonemesService } from 'src/apps/alfa-app/phonemes/phonemes.service';
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';
import { GoogleService } from 'src/integrations/google/google.service';
import { SpeechmaticsService } from 'src/integrations/speechmatics/speechmatics.service';
import { DeepgramService } from 'src/integrations/deepgram/deepgram.service';
import { SarvamService } from 'src/integrations/sarvam/sarvam.service';
import { ReverieService } from 'src/integrations/reverie/reverie.service';
import { ENGLISH_PHONEMES } from 'src/apps/alfa-app/phonemes/data/english-phonemes';
import { HINDI_PHONEMES } from 'src/apps/alfa-app/phonemes/data/hindi-phonemes';
import * as dotenv from 'dotenv';

// Load env for tests, if needed by any modules
dotenv.config();
// Reduce noisy logs during e2e: only show warnings and errors
Logger.overrideLogger(['warn', 'error']);

describe('PlatformController (e2e)', () => {
  let nestApp: INestApplication;
  let server: Server;
  let suppressLogs: jest.SpyInstance;

  let userRepo: Repository<User>;
  let appRepo: Repository<App>;
  let userEventRepo: Repository<UserEvent>;
  let appEventRepo: Repository<AppEvent>;
  let miniLessonRepo: Repository<MiniLesson>;
  let phonemeRepo: Repository<Phoneme>;

  let phonemesService: PhonemesService;

  let createdUser: User;
  let testApp: App;
  let createdInThisTest = false;
  let createdAppInThisTest = false;
  let initialPhonemeLetters: Set<string>;
  let preExistingAppIds: Set<number>;

  beforeEach(async () => {
    // Suppress noisy console.log while keeping warnings/errors visible via Nest logger
    suppressLogs = jest.spyOn(console, 'log').mockImplementation(() => {});

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PlatformModule, PhonemesModule],
    })
      .overrideProvider(ChatGPTService)
      .useValue({
        sendMessage: jest.fn().mockResolvedValue('mock-reply'),
        getBooleanFromAI: jest.fn().mockResolvedValue(true),
        transcribeAudio: jest.fn().mockResolvedValue('mock-transcription'),
      })
      .overrideProvider(GoogleService)
      .useValue({
        transcribeAudio: jest
          .fn()
          .mockResolvedValue('google-mock-transcription'),
      })
      .overrideProvider(SpeechmaticsService)
      .useValue({
        transcribeAudio: jest
          .fn()
          .mockResolvedValue('speechmatics-mock-transcription'),
      })
      .overrideProvider(DeepgramService)
      .useValue({
        transcribeAudio: jest
          .fn()
          .mockResolvedValue('deepgram-mock-transcription'),
      })
      .overrideProvider(SarvamService)
      .useValue({
        transcribeAudio: jest
          .fn()
          .mockResolvedValue('sarvam-mock-transcription'),
      })
      .overrideProvider(ReverieService)
      .useValue({
        transcribeAudio: jest
          .fn()
          .mockResolvedValue('reverie-mock-transcription'),
      })
      .compile();

    nestApp = moduleFixture.createNestApplication({
      logger: ['warn', 'error'],
    });
    await nestApp.init();

    userRepo = nestApp.get<Repository<User>>(getRepositoryToken(User));
    appRepo = nestApp.get<Repository<App>>(getRepositoryToken(App));
    userEventRepo = nestApp.get<Repository<UserEvent>>(
      getRepositoryToken(UserEvent),
    );
    appEventRepo = nestApp.get<Repository<AppEvent>>(
      getRepositoryToken(AppEvent),
    );
    miniLessonRepo = nestApp.get<Repository<MiniLesson>>(
      getRepositoryToken(MiniLesson),
    );
    phonemeRepo = nestApp.get<Repository<Phoneme>>(getRepositoryToken(Phoneme));

    server = nestApp.getHttpServer() as unknown as Server;

    /* snapshot existing apps so we can restore exact state later */
    const existingAppsBefore = await appRepo.find({ select: ['id'] });
    preExistingAppIds = new Set(existingAppsBefore.map((a) => a.id));

    /* ── reuse or create test user ─────────────────────────────── */
    const TEST_PHONE = '+919999999999';
    const existingUser = await userRepo.findOne({
      where: { phoneNumber: TEST_PHONE },
    });
    if (existingUser) {
      createdUser = existingUser;
      createdInThisTest = false;
    } else {
      createdUser = await userRepo.save(
        userRepo.create({ phoneNumber: TEST_PHONE }),
      );
      createdInThisTest = true;
    }
    /* ──────────────────────────────────────────────────────────── */

    phonemesService = nestApp.get(PhonemesService);
    // Track initial phoneme letters so we can revert seeding
    const existingPhonemes = await phonemeRepo.find({ select: ['letter'] });
    initialPhonemeLetters = new Set(
      existingPhonemes.map((p) => p.letter.toUpperCase()),
    );
    await phonemesService.seedEnglishAlphabet();
    await phonemesService.seedHindiAlphabet();

    /* reuse or create app row and remember if we created it */
    const existingApp = await appRepo.findOne({
      where: { http_path: 'alfa-app' },
    });
    if (existingApp) {
      testApp = existingApp;
      createdAppInThisTest = false;
    } else {
      testApp = await appRepo.save(
        appRepo.create({ http_path: 'alfa-app', is_active: true }),
      );
      createdAppInThisTest = true;
    }
  });

  afterEach(async () => {
    // Restore console logging
    if (suppressLogs) suppressLogs.mockRestore();
    /* clean resources made during the test */
    await miniLessonRepo.delete({ userId: createdUser.id });
    await userEventRepo.delete({ user: { id: createdUser.id } });
    await appEventRepo.delete({ user: { id: createdUser.id } });

    /* delete the user row only if *this* test created it */
    if (createdInThisTest) await userRepo.delete(createdUser.id);

    /* delete the app row only if *this* test created it */
    if (createdAppInThisTest) {
      await appRepo.delete(testApp.id);
    }

    /* remove any apps created during this test run to restore exact app table */
    const appsAfter = await appRepo.find({ select: ['id'] });
    const createdDuringTestIds = appsAfter
      .map((a) => a.id)
      .filter((id) => !preExistingAppIds.has(id));
    if (createdDuringTestIds.length > 0) {
      await appRepo.delete({ id: In(createdDuringTestIds) });
    }

    /* revert phoneme seeding: remove only phonemes that didn't exist before */
    const seededLetters = new Set(
      [...ENGLISH_PHONEMES, ...HINDI_PHONEMES].map((p) =>
        p.letter.toUpperCase(),
      ),
    );
    const seededNow = await phonemeRepo.find({
      where: { letter: In(Array.from(seededLetters)) },
      select: ['id', 'letter'],
    });
    const toDeleteIds = seededNow
      .filter((p) => !initialPhonemeLetters.has(p.letter.toUpperCase()))
      .map((p) => p.id);
    if (toDeleteIds.length > 0) {
      await phonemeRepo.delete({ id: In(toDeleteIds) });
    }

    await nestApp.close();
  });

  it('POST /processUserInput should create all necessary records', async () => {
    const dummyText = 'test-recording';
    const base64Payload = Buffer.from(dummyText, 'utf8').toString('base64');

    const res = await request(server)
      .post('/processUserInput')
      .set('Accept-Language', 'en')
      .send({
        recording: base64Payload,
        phoneNumber: createdUser.phoneNumber,
      })
      .expect(201);

    // Response structure
    expect(res.body).toHaveProperty('recording');
    expect(res.body).toHaveProperty('uiData');
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('appId');

    const userEvents = await userEventRepo.find({
      where: { user: { id: createdUser.id } },
    });
    const appEvents = await appEventRepo.find({
      where: { user: { id: createdUser.id } },
    });
    const miniLessons = await miniLessonRepo.find({
      where: { userId: createdUser.id },
    });

    expect(userEvents.length).toBe(1);
    expect(userEvents[0].recording.toString('utf8')).toBe(dummyText);

    expect(appEvents.length).toBe(1);
    expect(appEvents[0].recording).toEqual(expect.any(String));
    expect(appEvents[0].recording.length).toBeGreaterThan(0);

    expect(miniLessons.length).toBe(1);
    expect(miniLessons[0].word).toEqual(expect.any(String));
    const firstLessonState = createActor(lessonMachine, {
      snapshot: miniLessons[0].state,
    }).start();
    expect(firstLessonState.getSnapshot().value).toBe('word');
  });
});
