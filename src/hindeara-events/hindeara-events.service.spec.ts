import { Test, TestingModule } from '@nestjs/testing';
import { HindearaEventsService } from './hindeara-events.service';

describe('HindearaEventsService', () => {
  let service: HindearaEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HindearaEventsService],
    }).compile();

    service = module.get<HindearaEventsService>(HindearaEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
