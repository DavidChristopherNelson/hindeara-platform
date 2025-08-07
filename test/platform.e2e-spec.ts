// test/platform.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { PlatformModule } from '../src/hindeara-platform/platform/platform.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/hindeara-platform/users/entities/user.entity';
import { UserEvent } from '../src/hindeara-platform/user-events/entities/user-event.entity';
import { AppEvent } from '../src/hindeara-platform/app-events/entities/app-event.entity';
import { MiniLesson } from '../src/apps/alfa-app/mini-lessons/entities/mini-lesson.entity';
import { Server } from 'http';
import { createActor } from 'xstate';
import { lessonMachine } from 'src/apps/alfa-app/state/state.machine';
import { App } from 'src/hindeara-platform/apps/entities/app.entity';
import { PhonemesModule } from 'src/apps/alfa-app/phonemes/phonemes.module';
import { PhonemesService } from 'src/apps/alfa-app/phonemes/phonemes.service';
import { ChatGPTService } from 'src/integrations/chatgpt/chatgpt.service';

describe('PlatformController (e2e)', () => {
  let nestApp: INestApplication;
  let server: Server;

  let userRepo: Repository<User>;
  let appRepo: Repository<App>;
  let userEventRepo: Repository<UserEvent>;
  let appEventRepo: Repository<AppEvent>;
  let miniLessonRepo: Repository<MiniLesson>;

  let phonemesService: PhonemesService;

  let createdUser: User;
  let testApp: App;
  let createdInThisTest = false;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PlatformModule, PhonemesModule],
    })
      .overrideProvider(ChatGPTService)
      .useValue({
        sendMessage: jest.fn().mockResolvedValue('mock-reply'),
        getBooleanFromAI: jest.fn().mockResolvedValue(true),
        transcribeAudio: jest.fn().mockResolvedValue('mock-transcription'),
      })
      .compile();

    nestApp = moduleFixture.createNestApplication({
      logger: new Logger('E2E'),
    });
    await nestApp.init();
    nestApp.useLogger(['log', 'debug', 'warn', 'error', 'verbose']);

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

    server = nestApp.getHttpServer() as unknown as Server;

    /* ── reuse or create test user ─────────────────────────────── */
    const TEST_PHONE = '+919999999999';
    createdUser =
      (await userRepo.findOne({ where: { phoneNumber: TEST_PHONE } })) ??
      (await userRepo.save(userRepo.create({ phoneNumber: TEST_PHONE })));
    createdInThisTest = !createdUser.createdAt;
    /* ──────────────────────────────────────────────────────────── */

    phonemesService = nestApp.get(PhonemesService);
    await phonemesService.seedEnglishAlphabet();
    await phonemesService.seedHindiAlphabet();

    /* reuse or create app row (idempotent) */
    testApp =
      (await appRepo.findOne({ where: { http_path: 'alfa-app' } })) ??
      (await appRepo.save(
        appRepo.create({ http_path: 'alfa-app', is_active: true }),
      ));
  });

  afterEach(async () => {
    /* clean resources made during the test */
    await miniLessonRepo.delete({ userId: createdUser.id });
    await userEventRepo.delete({ user: { id: createdUser.id } });
    await appEventRepo.delete({ user: { id: createdUser.id } });

    /* delete the user row only if *this* test created it */
    if (createdInThisTest) await userRepo.delete(createdUser.id);

    /* delete app row only if no other events reference it anymore */
    const remainingAppEvents = await appEventRepo.count({
      where: { app: { id: testApp.id } },
    });
    if (remainingAppEvents === 0) await appRepo.delete(testApp.id);

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
