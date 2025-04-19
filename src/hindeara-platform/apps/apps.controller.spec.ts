/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { App } from './entities/app.entity';

describe('AppsController', () => {
  let controller: AppsController;
  let appsService: AppsService;

  const mockApp: App = {
    id: 1,
    http_path: '/test',
    is_active: true,
    appInstances: [],
  };

  // Create a partial mock of the AppsService with jest.fn mocks for each method.
  const mockAppsService = {
    create: jest.fn<Promise<App>, [CreateAppDto]>().mockResolvedValue(mockApp),
    findAll: jest.fn<Promise<App[]>, []>().mockResolvedValue([mockApp]),
    findOne: jest
      .fn<Promise<App | null>, [number]>()
      .mockResolvedValue(mockApp),
    update: jest
      .fn<Promise<App | null>, [number, UpdateAppDto]>()
      .mockResolvedValue(mockApp),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsController],
      providers: [
        {
          provide: AppsService,
          useValue: mockAppsService,
        },
      ],
    }).compile();

    controller = module.get<AppsController>(AppsController);
    appsService = module.get<AppsService>(AppsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new app', async () => {
      const dto: CreateAppDto = {
        http_path: '/test',
        is_active: true,
      };
      const result = await controller.create(dto);
      expect(appsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockApp);
    });
  });

  describe('findAll', () => {
    it('should return an array of apps', async () => {
      const result = await controller.findAll();
      expect(appsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockApp]);
    });
  });

  describe('findOne', () => {
    it('should return an app for a valid id', async () => {
      const id = 1;
      const result = await controller.findOne(id);
      expect(appsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockApp);
    });

    it('should return null when no app is found', async () => {
      // Override the mock for this test to simulate a not found app.
      (appsService.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await controller.findOne(999);
      expect(appsService.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the updated app', async () => {
      const dto: UpdateAppDto = { is_active: false };
      const id = 1;
      const updatedApp: App = { ...mockApp, is_active: false };

      // Reassign the mocks to simulate returning an updated app.
      (appsService.update as jest.Mock).mockResolvedValueOnce(updatedApp);
      (appsService.findOne as jest.Mock).mockResolvedValueOnce(updatedApp);

      const result = await controller.update(id, dto);
      expect(appsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedApp);
    });

    it('should throw NotFoundException if the app to update is not found', async () => {
      const dto: UpdateAppDto = { is_active: false };
      const id = 999;
      // Simulate NotFoundException thrown by the service.
      (appsService.update as jest.Mock).mockRejectedValueOnce(
        new NotFoundException(`App with ID ${id} not found`),
      );
      await expect(controller.update(id, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(appsService.update).toHaveBeenCalledWith(999, dto);
    });
  });
});
