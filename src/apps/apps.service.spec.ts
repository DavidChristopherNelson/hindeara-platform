import { Test, TestingModule } from '@nestjs/testing';
import { AppsService } from './apps.service';
import { App } from './entities/app.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any, any>;
};

describe('AppsService', () => {
  let service: AppsService;
  let repository: MockType<Repository<App>>;

  const testApp: App = {
    id: 1,
    http_path: 'path/to/app',
    is_active: true,
    appInstances: [],
  };

  const mockRepository: MockType<Repository<App>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppsService,
        {
          provide: getRepositoryToken(App),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AppsService>(AppsService);
    repository = module.get<Repository<App>>(
      getRepositoryToken(App),
    ) as unknown as MockType<Repository<App>>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new app', async () => {
      const createAppDto = { http_path: 'path/to/app' };
      repository.create!.mockReturnValue(testApp);
      repository.save!.mockResolvedValue(testApp);

      const result = await service.create(createAppDto);
      expect(repository.create).toHaveBeenCalledWith(createAppDto);
      expect(repository.save).toHaveBeenCalledWith(testApp);
      expect(result).toEqual(testApp);
    });
  });

  describe('findAll', () => {
    it('should return an array of apps', async () => {
      repository.find!.mockResolvedValue([testApp]);

      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([testApp]);
    });
  });

  describe('findOne', () => {
    it('should return an app if found', async () => {
      repository.findOne!.mockResolvedValue(testApp);

      const result = await service.findOne(1);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(testApp);
    });

    it('should return null if app is not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the updated app', async () => {
      const updateAppDto = { is_active: false };
      repository.update!.mockResolvedValue({ affected: 1 });
      repository.findOne!.mockResolvedValue(testApp);

      const result = await service.update(1, updateAppDto);
      expect(repository.update).toHaveBeenCalledWith(1, updateAppDto);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(testApp);
    });

    it('should throw a NotFoundException if no app is updated', async () => {
      const updateAppDto = { is_active: false };
      repository.update!.mockResolvedValue({ affected: 0 });

      await expect(service.update(1, updateAppDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
