import { Test, TestingModule } from '@nestjs/testing';
import { AppInstancesController } from './app-instances.controller';
import { AppInstancesService } from './app-instances.service';

describe('AppInstancesController', () => {
  let controller: AppInstancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppInstancesController],
      providers: [AppInstancesService],
    }).compile();

    controller = module.get<AppInstancesController>(AppInstancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
