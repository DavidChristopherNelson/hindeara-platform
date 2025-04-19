import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any, any>;
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockType<Repository<User>>;

  const testUser: User = {
    id: 1,
    createdAt: new Date(),
    hindearaEvents: [],
  };

  const mockRepository: MockType<Repository<User>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(
      getRepositoryToken(User),
    ) as unknown as MockType<Repository<User>>;

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const createUserDto = {};
      repository.create!.mockReturnValue(testUser);
      repository.save!.mockResolvedValue(testUser);

      const result = await service.create(createUserDto);
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(testUser);
      expect(result).toEqual(testUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      repository.find!.mockResolvedValue([testUser]);

      const result = await service.findAll();
      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([testUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      repository.findOne!.mockResolvedValue(testUser);

      const result = await service.findOne(1);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(testUser);
    });

    it('should return null if user is not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const updateUserDto = {};
      repository.update!.mockResolvedValue({ affected: 1 });
      repository.findOne!.mockResolvedValue(testUser);

      const result = await service.update(1, updateUserDto);
      expect(repository.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(testUser);
    });

    it('should throw a NotFoundException if no user is updated', async () => {
      const updateUserDto = {};
      repository.update!.mockResolvedValue({ affected: 0 });

      await expect(service.update(1, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the user successfully', async () => {
      repository.delete!.mockResolvedValue({ affected: 1 });

      await service.remove(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw a NotFoundException if no user was deleted', async () => {
      repository.delete!.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
