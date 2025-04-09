import { Test, TestingModule } from '@nestjs/testing';
import { HindearaEventsService } from './hindeara-events.service';
import { HindearaEvent } from './entities/hindeara-event.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any, any>;
};

describe('HindearaEventsService', () => {
  let service: HindearaEventsService;
  let hindearaEventRepository: MockType<Repository<HindearaEvent>>;
  let usersService: MockType<UsersService>;

  const testUser = {
    id: 1,
    createdAt: new Date(),
    hindearaEvents: [],
  };

  const testHindearaEvent: HindearaEvent = {
    id: 1,
    user: testUser,
    recording: '',
    createdAt: new Date(),
  };

  const mockHindearaEventRepository: MockType<Repository<HindearaEvent>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUsersService: Partial<UsersService> = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HindearaEventsService,
        {
          provide: getRepositoryToken(HindearaEvent),
          useValue: mockHindearaEventRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<HindearaEventsService>(HindearaEventsService);
    hindearaEventRepository = module.get<Repository<HindearaEvent>>(
      getRepositoryToken(HindearaEvent),
    ) as unknown as MockType<Repository<HindearaEvent>>;
    usersService = module.get<UsersService>(
      UsersService,
    ) as unknown as MockType<UsersService>;

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new hindeara event', async () => {
      const createHindearaEventDto = {
        userId: testUser.id,
        name: 'Test Event',
      };
      usersService.findOne!.mockResolvedValue(testUser);
      hindearaEventRepository.create!.mockReturnValue(testHindearaEvent);
      hindearaEventRepository.save!.mockResolvedValue(testHindearaEvent);

      const result = await service.create(createHindearaEventDto);

      expect(usersService.findOne).toHaveBeenCalledWith(testUser.id);
      expect(hindearaEventRepository.create).toHaveBeenCalledWith({
        ...createHindearaEventDto,
        user: testUser,
      });
      expect(hindearaEventRepository.save).toHaveBeenCalledWith(
        testHindearaEvent,
      );
      expect(result).toEqual(testHindearaEvent);
    });

    it('should throw a NotFoundException if user is not found', async () => {
      const createHindearaEventDto = { userId: 999, name: 'Test Event' };
      usersService.findOne!.mockResolvedValue(null);

      await expect(service.create(createHindearaEventDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of hindeara events', async () => {
      hindearaEventRepository.find!.mockResolvedValue([testHindearaEvent]);

      const result = await service.findAll();

      expect(hindearaEventRepository.find).toHaveBeenCalled();
      expect(result).toEqual([testHindearaEvent]);
    });
  });

  describe('findOne', () => {
    it('should return a hindeara event if found', async () => {
      hindearaEventRepository.findOne!.mockResolvedValue(testHindearaEvent);

      const result = await service.findOne(1);

      expect(hindearaEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(testHindearaEvent);
    });

    it('should return null if hindeara event is not found', async () => {
      hindearaEventRepository.findOne!.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });
});
