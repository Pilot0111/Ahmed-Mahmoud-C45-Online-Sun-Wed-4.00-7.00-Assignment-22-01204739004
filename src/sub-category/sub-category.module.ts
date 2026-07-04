import { Module } from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';
import { SubCategoryRepository } from 'src/DB/repositories/sub-category.repository';
import { subCategoryModel } from 'src/DB/models/sub-category.model';
import { categoryModel } from 'src/DB/models/category.model';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import { S3Service } from 'src/common/service/s3.service';

@Module({
  imports: [subCategoryModel, categoryModel],
  controllers: [SubCategoryController],
  providers: [SubCategoryService, SubCategoryRepository, CategoryRepository, S3Service],
})
export class SubCategoryModule {}
