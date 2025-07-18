// src/hindeara-platform/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserByIdPipe } from './pipes/user-by-id.pipe';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMethod } from 'src/common/decorators/log-method.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created.',
    type: User,
  })
  @LogMethod()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all users.',
    type: [User],
  })
  @LogMethod()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the user with a matching id.',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @LogMethod()
  findOne(@Param('id', ParseIntPipe, UserByIdPipe) user: User): User {
    return user;
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @LogMethod()
  async update(
    @Param('id', ParseIntPipe, UserByIdPipe) user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user, updateUserDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiResponse({ status: 204, description: 'User deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @LogMethod()
  async remove(
    @Param('id', ParseIntPipe, UserByIdPipe) user: User,
  ): Promise<void> {
    return this.usersService.remove(user);
  }
}
