import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { brandModel } from 'src/DB/models/brand.model';
import { JwtService } from '@nestjs/jwt';
import { userModel } from 'src/DB/models/user.model';
import { TokenService } from 'src/common/utils/security/toke.security';
import { S3Service } from 'src/common/service/s3.service';
import { UserRepository } from 'src/DB/repositories/user.repository';
import { BrandRepository } from 'src/DB/repositories/brand.repository';

@Module({
  imports: [brandModel, userModel],
  controllers: [BrandController],
  providers: [BrandService, JwtService, TokenService, S3Service, UserRepository, BrandRepository],
})
export class BrandModule {}
