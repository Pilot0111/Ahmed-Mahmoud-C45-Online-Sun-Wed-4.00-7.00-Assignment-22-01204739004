import { Module } from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { SubCategoryController } from './sub-category.controller';
import { SubCategoryRepository } from 'src/DB/repositories/sub-category.repository';
import { subCategoryModel } from 'src/DB/models/sub-category.model';
import { CategoryModule } from 'src/category/category.module';

@Module({
  imports: [subCategoryModel, CategoryModule],
  controllers: [SubCategoryController],
  providers: [
    SubCategoryService,
    SubCategoryRepository,
  ],
  exports: [SubCategoryRepository],
})
export class SubCategoryModule {}
