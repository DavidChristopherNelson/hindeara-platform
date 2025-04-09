/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AppInstancesController } from './app-instances.controller';
import { AppInstancesService } from './app-instances.service';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';
import { AppInstance, AppStatus } from './entities/app-instance.entity';

describe('AppInstancesController', () => {
  let controller: AppInstancesController;
  let appInstancesService: AppInstancesService;

  // Create a mock AppInstance with sample data.
  const mockAppInstance: AppInstance = {
    id: 1,
    status: AppStatus.USER_REQUEST,
    hindearaEvent: {
      id: 100,
      recording: 'test-recording',
      createdAt: new Date(),
      user: {
        id: 42,
        createdAt: new Date(),
        hindearaEvents: [],
      },
      appInstance: undefined,
    },
    app: {
      id: 2,
      http_path: '/test',
      is_active: true,
      appInstances: [],
    },
  };

  // Create a partial mock for the AppInstancesService.
  const mockAppInstancesService = {
    create: jest
      .fn<Promise<AppInstance>, [CreateAppInstanceDto]>()
      .mockResolvedValue(mockAppInstance),
    findAll: jest
      .fn<Promise<AppInstance[]>, []>()
      .mockResolvedValue([mockAppInstance]),
    findOne: jest
      .fn<Promise<AppInstance | null>, [number]>()
      .mockResolvedValue(mockAppInstance),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppInstancesController],
      providers: [
        { provide: AppInstancesService, useValue: mockAppInstancesService },
      ],
    }).compile();

    controller = module.get<AppInstancesController>(AppInstancesController);
    appInstancesService = module.get<AppInstancesService>(AppInstancesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new app instance', async () => {
      const dto: CreateAppInstanceDto = {
        status: AppStatus.USER_REQUEST,
        hindearaEventId: 100,
        appId: 2,
      };
      const result = await controller.create(dto);
      expect(appInstancesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAppInstance);
    });
  });

  describe('findAll', () => {
    it('should return an array of app instances', async () => {
      const result = await controller.findAll();
      expect(appInstancesService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockAppInstance]);
    });
  });

  describe('findOne', () => {
    it('should return an app instance for a valid id', async () => {
      // The controller method expects a string (as received from route params),
      // but converts it internally to number.
      const result = await controller.findOne(1);
      expect(appInstancesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAppInstance);
    });

    it('should return null when the app instance is not found', async () => {
      (appInstancesService.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await controller.findOne(999);
      expect(appInstancesService.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});
