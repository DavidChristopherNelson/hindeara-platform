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

    // Capture the HTTP server as a proper Server type
    server = nestApp.getHttpServer() as unknown as Server;

    // Create a user for testing
    createdUser = await userRepo.save(
      userRepo.create({
        phoneNumber: `e2e-${Date.now()}`,
      }),
    );

    // ---- SEED ----
    phonemesService = nestApp.get(PhonemesService);
    await phonemesService.seedEnglishAlphabet();
    await phonemesService.seedHindiAlphabet();

    // Create an app for testing
    await appRepo.save(
      appRepo.create({
        http_path: 'alfa-app',
        is_active: true,
      }),
    );
  });

  afterEach(async () => {
    await nestApp.close();
  });

  it('POST /users/:userId/processUserInput should create all necessary records', async () => {
    const dummyText = 'test-recording';
    const base64Payload = Buffer.from(dummyText, 'utf8').toString('base64');

    const res = await request(server)
      .post(`/users/${createdUser.id}/processUserInput`)
      .set('Accept-Language', 'en')
      .send({ recording: base64Payload })
      .expect(201);

    // Verify response structure
    expect(res.body).toHaveProperty('recording');
    expect(res.body).toHaveProperty('uiData');
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('appId');

    // Check the resources
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
