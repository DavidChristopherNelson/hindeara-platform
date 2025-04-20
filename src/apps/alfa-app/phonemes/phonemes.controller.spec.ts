import { Test, TestingModule } from '@nestjs/testing';
import { PhonemesController } from './phonemes.controller';
import { PhonemesService } from './phonemes.service';

describe('PhonemesController', () => {
  let controller: PhonemesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhonemesController],
      providers: [PhonemesService],
    }).compile();

    controller = module.get<PhonemesController>(PhonemesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
