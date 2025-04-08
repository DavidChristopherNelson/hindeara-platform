import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppInstancesService } from './app-instances.service';
import { CreateAppInstanceDto } from './dto/create-app-instance.dto';
import { UpdateAppInstanceDto } from './dto/update-app-instance.dto';

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppInstanceDto: UpdateAppInstanceDto) {
    return this.appInstancesService.update(+id, updateAppInstanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appInstancesService.remove(+id);
  }
}
