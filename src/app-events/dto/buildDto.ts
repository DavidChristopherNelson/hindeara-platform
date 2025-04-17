import { Injectable } from '@nestjs/common';
import { AppsService } from 'src/apps/apps.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class Builder {
  constructor(
    private readonly usersService: UsersService,
    private readonly appsService: AppsService,
  ) {}

  async createDtoFromUserId(user: User) {
    const currentApp = await this.appsService.findCurrentApp(user);
    return this.appsService.runApp(user, currentApp);
  }
}
