import { Test, TestingModule } from '@nestjs/testing';
import { PhonemesService } from './phonemes.service';

describe('PhonemesService', () => {
  let service: PhonemesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhonemesService],
    }).compile();

    service = module.get<PhonemesService>(PhonemesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
