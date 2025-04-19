import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { App } from './entities/app.entity';

@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Post()
  async create(@Body() createAppDto: CreateAppDto): Promise<App> {
    return this.appsService.create(createAppDto);
  }

  @Get()
  async findAll(): Promise<App[]> {
    return this.appsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<App | null> {
    return this.appsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppDto: UpdateAppDto,
  ): Promise<App | null> {
    return this.appsService.update(id, updateAppDto);
  }
}
