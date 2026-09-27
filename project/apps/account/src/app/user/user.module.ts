import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongoRepository } from './user-mongo.repository';
import { UserModel, UserSchema } from './user.model';
import { UserController } from './user.controller';
import { USER_REPOSITORY } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserMongoRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: UserMongoRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
