import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import { S3Service } from 'src/common/service/s3.service';
import { categoryModel } from 'src/DB/models/category.model';
import { brandModel } from 'src/DB/models/brand.model';
import { BrandRepository } from 'src/DB/repositories/brand.repository';

@Module({
  imports: [categoryModel, brandModel],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, BrandRepository, S3Service],
})
export class CategoryModule {}
