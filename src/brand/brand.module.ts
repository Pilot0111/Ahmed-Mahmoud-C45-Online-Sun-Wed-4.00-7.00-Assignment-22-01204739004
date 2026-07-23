import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { brandModel } from 'src/DB/models/brand.model';
import { BrandRepository } from 'src/DB/repositories/brand.repository';

@Module({
  imports: [brandModel],
  controllers: [BrandController],
  providers: [
    BrandService,
    BrandRepository,
  ],
  exports: [BrandRepository],
})
export class BrandModule {}
