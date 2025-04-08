import { Test, TestingModule } from '@nestjs/testing';
import { AppInstancesService } from './app-instances.service';

describe('AppInstancesService', () => {
  let service: AppInstancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppInstancesService],
    }).compile();

    service = module.get<AppInstancesService>(AppInstancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
