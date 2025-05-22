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
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Post()
  @ApiBody({ type: CreateAppDto })
  @ApiResponse({
    status: 201,
    description: 'App successfully created.',
    type: App,
  })
  @LogMethod()
  async create(@Body() createAppDto: CreateAppDto): Promise<App> {
    return this.appsService.create(createAppDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all apps.',
    type: [App],
  })
  @LogMethod()
  async findAll(): Promise<App[]> {
    return this.appsService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Returns the app that matches the id.',
    type: App,
  })
  @LogMethod()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<App | null> {
    return this.appsService.findOne(id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateAppDto })
  @ApiResponse({ status: 200, description: 'App updated.', type: App })
  @ApiResponse({ status: 404, description: 'App not found.' })
  @LogMethod()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppDto: UpdateAppDto,
  ): Promise<App | null> {
    return this.appsService.update(id, updateAppDto);
  }
}
