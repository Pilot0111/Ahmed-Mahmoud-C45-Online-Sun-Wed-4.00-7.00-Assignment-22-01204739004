import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { userModel } from 'src/DB/models/user.model';
import { UserRepository } from 'src/DB/repositories/user.repository';
import { RedisModule } from 'src/common/redis/redis.module';
import { TokenService } from 'src/common/utils/security/toke.security';

@Module({
  imports: [userModel, RedisModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    TokenService,
  ],
})
export class UserModule {}
