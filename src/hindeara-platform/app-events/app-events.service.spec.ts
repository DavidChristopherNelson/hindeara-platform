import { Test, TestingModule } from '@nestjs/testing';
import { AppEventsService } from './app-events.service';

describe('AppEventsService', () => {
  let service: AppEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppEventsService],
    }).compile();

    service = module.get<AppEventsService>(AppEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
