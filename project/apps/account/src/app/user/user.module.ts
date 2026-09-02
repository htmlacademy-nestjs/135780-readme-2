import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserMemoryRepository } from './user-memory.repository';
import { USER_REPOSITORY } from './user.repository';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserMemoryRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: UserMemoryRepository,
    },
  ],
})
export class UserModule {}
