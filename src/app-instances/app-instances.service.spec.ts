import { Test, TestingModule } from '@nestjs/testing';
import { AppInstancesService } from './app-instances.service';
import { AppInstance, AppStatus } from './entities/app-instance.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HindearaEventsService } from '../hindeara-events/hindeara-events.service';
import { AppsService } from '../apps/apps.service';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any, any>;
};

describe('AppInstancesService', () => {
  let service: AppInstancesService;
  let repository: MockType<Repository<AppInstance>>;
  let hindearaEventsService: MockType<HindearaEventsService>;
  let appsService: MockType<AppsService>;

  // Dummy objects for testing
  const testHindearaEvent = { id: 1 } as any;
  const testApp = { id: 1, name: 'Test App' } as any;

  const testAppInstance: AppInstance = {
    id: 1,
    status: AppStatus.USER_REQUEST,
    hindearaEvent: testHindearaEvent,
    app: testApp,
  };

  const createAppInstanceDto: CreateAppInstanceDto = {
    status: AppStatus.USER_REQUEST,
    hindearaEventId: testHindearaEvent.id,
    appId: testApp.id,
  };

  const mockRepository: MockType<Repository<AppInstance>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockHindearaEventsService: Partial<HindearaEventsService> = {
    findOne: jest.fn(),
  };

  const mockAppsService: Partial<AppsService> = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppInstancesService,
        {
          provide: getRepositoryToken(AppInstance),
          useValue: mockRepository,
        },
        {
          provide: HindearaEventsService,
          useValue: mockHindearaEventsService,
        },
        {
          provide: AppsService,
          useValue: mockAppsService,
        },
      ],
    }).compile();

    service = module.get<AppInstancesService>(AppInstancesService);
    repository = module.get<Repository<AppInstance>>(
      getRepositoryToken(AppInstance),
    ) as unknown as MockType<Repository<AppInstance>>;
    hindearaEventsService = module.get<HindearaEventsService>(
      HindearaEventsService,
    ) as unknown as MockType<HindearaEventsService>;
    appsService = module.get<AppsService>(AppsService) as unknown as MockType<AppsService>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new app instance', async () => {
      // Simulate that the associated HindearaEvent and App exist.
      hindearaEventsService.findOne!.mockResolvedValue(testHindearaEvent);
      appsService.findOne!.mockResolvedValue(testApp);
      repository.create!.mockReturnValue(testAppInstance);
      repository.save!.mockResolvedValue(testAppInstance);

      const result = await service.create(createAppInstanceDto);

      expect(hindearaEventsService.findOne).toHaveBeenCalledWith(
        createAppInstanceDto.hindearaEventId,
      );
      expect(appsService.findOne).toHaveBeenCalledWith(createAppInstanceDto.appId);
      const expectedCreateArg = {
        ...createAppInstanceDto,
        hindearaEvent: testHindearaEvent,
        app: testApp,
      };
      expect(repository.create).toHaveBeenCalledWith(expectedCreateArg);
      expect(repository.save).toHaveBeenCalledWith(testAppInstance);
      expect(result).toEqual(testAppInstance);
    });

    it('should throw a NotFoundException if HindearaEvent is not found', async () => {
      hindearaEventsService.findOne!.mockResolvedValue(null);

      await expect(service.create(createAppInstanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw a NotFoundException if App is not found', async () => {
      hindearaEventsService.findOne!.mockResolvedValue(testHindearaEvent);
      appsService.findOne!.mockResolvedValue(null);

      await expect(service.create(createAppInstanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of app instances', async () => {
      repository.find!.mockResolvedValue([testAppInstance]);

      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([testAppInstance]);
    });
  });

  describe('findOne', () => {
    it('should return an app instance if found', async () => {
      repository.findOne!.mockResolvedValue(testAppInstance);

      const result = await service.findOne(1);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(testAppInstance);
    });

    it('should return null if app instance is not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });
});
