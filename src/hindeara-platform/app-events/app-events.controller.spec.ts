import { Test, TestingModule } from '@nestjs/testing';
import { AppEventsController } from './app-events.controller';
import { AppEventsService } from './app-events.service';

describe('AppEventsController', () => {
  let controller: AppEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppEventsController],
      providers: [AppEventsService],
    }).compile();

    controller = module.get<AppEventsController>(AppEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
