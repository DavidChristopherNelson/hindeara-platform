import { AppsService } from 'src/apps/apps.service';
import { UsersService } from 'src/users/users.service';

export class Builder {
  constructor(
    private readonly usersService: UsersService,
    private readonly appsService: AppsService,
  ) {}

  async createDtoFromUserId(userId: number) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const currentApp = await this.appsService.findCurrentApp(user);
    return this.appsService.runApp(user, currentApp);
  }
}
