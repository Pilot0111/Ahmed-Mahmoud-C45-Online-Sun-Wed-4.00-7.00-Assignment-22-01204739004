import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import { categoryModel } from 'src/DB/models/category.model';
import { BrandModule } from 'src/brand/brand.module';

@Module({
  imports: [categoryModel, BrandModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryRepository],
})
export class CategoryModule {}
