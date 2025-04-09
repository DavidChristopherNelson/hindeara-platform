import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';
import { AppInstance } from './entities/app-instance.entity';

@Controller('app-instances')
export class AppInstancesController {
  constructor(private readonly appInstancesService: AppInstancesService) {}

  @Post()
  async create(
    @Body() createAppInstanceDto: CreateAppInstanceDto,
  ): Promise<AppInstance> {
    return this.appInstancesService.create(createAppInstanceDto);
  }

  @Get()
  async findAll(): Promise<AppInstance[]> {
    return this.appInstancesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppInstance | null> {
    return this.appInstancesService.findOne(+id);
  }
}
