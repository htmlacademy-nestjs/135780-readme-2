import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccountNotificationPublisher } from '../notification/notification.publisher';
import { LoginUserDto } from './dto/login-user.dto';
import { UserDetailRdo } from './rdo/user-detail.rdo';
import { UserEntity } from './user.entity';
import { USER_REPOSITORY, type UserRepository } from './user.repository';
import { SubscriptionRepository } from '../subscription/subscription.repository';

@Injectable()
export class UserService {
  public constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: UserRepository,
    private readonly notificationPublisher: AccountNotificationPublisher,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  public async register(dto: CreateUserDto): Promise<UserDetailRdo> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.repository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const entity = await UserEntity.create(
      { email, name: dto.name, avatarId: dto.avatarId },
      dto.password,
    );

    await this.repository.save(entity);
    await this.notificationPublisher.flush();
    return this.createDetail(entity);
  }

  public async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('User not found');
    }
    if (!(await entity.comparePassword(dto.currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await entity.setPassword(dto.newPassword);
    await this.repository.save(entity);
  }

  public async verifyCredentials(dto: LoginUserDto): Promise<UserDetailRdo> {
    const entity = await this.repository.findByEmail(dto.email.toLowerCase());

    if (!entity || !(await entity.comparePassword(dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createDetail(entity);
  }

  public async getById(id: string): Promise<UserDetailRdo> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('User not found');
    }

    return this.createDetail(
      entity,
      await this.subscriptions.countByAuthor(id),
    );
  }

  private createDetail(
    entity: UserEntity,
    subscriberCount = entity.subscriberCount,
  ): UserDetailRdo {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      avatarId: entity.avatarId,
      createdAt: entity.createdAt,
      publicationCount: entity.publicationCount,
      subscriberCount,
    };
  }
}
