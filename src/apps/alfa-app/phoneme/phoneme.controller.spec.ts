import { Test, TestingModule } from '@nestjs/testing';
import { PhonemeController } from './phoneme.controller';
import { PhonemeService } from './phoneme.service';

describe('PhonemeController', () => {
  let controller: PhonemeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhonemeController],
      providers: [PhonemeService],
    }).compile();

    controller = module.get<PhonemeController>(PhonemeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
