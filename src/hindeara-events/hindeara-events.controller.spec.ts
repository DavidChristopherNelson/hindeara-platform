/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HindearaEventsController } from './hindeara-events.controller';
import { HindearaEventsService } from './hindeara-events.service';
import { CreateHindearaEventDto } from './dto/create-hindeara-event.dto';
import { HindearaEvent } from './entities/hindeara-event.entity';

interface TestHindearaEventsService {
  create(dto: CreateHindearaEventDto): Promise<HindearaEvent>;
  findAll(): Promise<HindearaEvent[]>;
  findOne(id: number): Promise<HindearaEvent | null>;
}

describe('HindearaEventsController', () => {
  let controller: HindearaEventsController;
  let eventsService: HindearaEventsService;

  const mockHindearaEvent: HindearaEvent = {
    id: 1,
    recording: 'test-recording',
    createdAt: new Date(),
    user: {
      id: 42,
      createdAt: new Date(),
      hindearaEvents: [],
    },
    appInstance: undefined,
  };

  const mockEventsService: Partial<TestHindearaEventsService> = {
    create: jest
      .fn<Promise<HindearaEvent>, [CreateHindearaEventDto]>()
      .mockResolvedValue(mockHindearaEvent),
    findAll: jest
      .fn<Promise<HindearaEvent[]>, []>()
      .mockResolvedValue([mockHindearaEvent]),
    findOne: jest
      .fn<Promise<HindearaEvent | null>, [number]>()
      .mockResolvedValue(mockHindearaEvent),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HindearaEventsController],
      providers: [
        {
          provide: HindearaEventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();
    controller = module.get(HindearaEventsController);
    eventsService = module.get(HindearaEventsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new event', async () => {
      const dto: CreateHindearaEventDto = {
        userId: 42,
        recording: 'test-recording',
      };
      const result = await controller.create(dto);
      expect(eventsService.create as jest.Mock).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockHindearaEvent);
    });
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const result = await controller.findAll();
      expect(eventsService.findAll as jest.Mock).toHaveBeenCalled();
      expect(result).toEqual([mockHindearaEvent]);
    });
  });

  describe('findOne', () => {
    it('should return an event for a valid id', async () => {
      const id = 1;
      const result = await controller.findOne(id);
      expect(eventsService.findOne as jest.Mock).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockHindearaEvent);
    });

    it('should return null when event is not found', async () => {
      const id = 999;
      (eventsService.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await controller.findOne(id);
      expect(eventsService.findOne as jest.Mock).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });
});
