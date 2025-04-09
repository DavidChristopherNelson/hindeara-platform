import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser: User = {
    id: 1,
    createdAt: new Date(),
    hindearaEvents: [],
  };

  const mockUsersService: Partial<UsersService> = {
    create: jest
      .fn<Promise<User>, [CreateUserDto]>()
      .mockResolvedValue(mockUser),
    findAll: jest.fn<Promise<User[]>, []>().mockResolvedValue([mockUser]),
    findOne: jest.fn<Promise<User>, [number]>().mockResolvedValue(mockUser),
    update: jest
      .fn<Promise<User>, [number, UpdateUserDto]>()
      .mockResolvedValue(mockUser),
    remove: jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createUserDto = {} as CreateUserDto;
      const result = (await controller.create(createUserDto)) as User;
      expect(usersService.create.bind(usersService)).toHaveBeenCalledWith(
        createUserDto,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = (await controller.findAll()) as User[];
      expect(usersService.findAll.bind(usersService)).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const id = 1;
      const result = (await controller.findOne(id)) as User;
      expect(usersService.findOne.bind(usersService)).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const updateUserDto = {} as UpdateUserDto;
      const id = 1;
      const result = (await controller.update(id, updateUserDto)) as User;
      expect(usersService.update.bind(usersService)).toHaveBeenCalledWith(
        id,
        updateUserDto,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should remove the user and return void', async () => {
      const id = 1;
      await expect(controller.remove(id)).resolves.toBeUndefined();
      expect(usersService.remove.bind(usersService)).toHaveBeenCalledWith(id);
    });
  });
});
