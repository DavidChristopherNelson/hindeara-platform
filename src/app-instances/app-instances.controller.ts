import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';

@Controller('app-instances')
export class AppInstancesController {
  constructor(private readonly appInstancesService: AppInstancesService) {}

  @Post()
  create(@Body() createAppInstanceDto: CreateAppInstanceDto) {
    return this.appInstancesService.create(createAppInstanceDto);
  }

  @Get()
  findAll() {
    return this.appInstancesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appInstancesService.findOne(+id);
  }
}
