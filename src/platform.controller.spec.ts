import { Test, TestingModule } from '@nestjs/testing';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

describe('PlatformController', () => {
  let platformController: PlatformController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PlatformController],
      providers: [PlatformService],
    }).compile();

    platformController = app.get<PlatformController>(PlatformController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(platformController.getHello()).toBe('Hello World!');
    });
  });
});
