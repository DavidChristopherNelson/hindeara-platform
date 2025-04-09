import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';

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
  async findOne(@Param('id') id: string): Promise<AppInstance | null> {
    return this.appInstancesService.findOne(+id);
  }
}
