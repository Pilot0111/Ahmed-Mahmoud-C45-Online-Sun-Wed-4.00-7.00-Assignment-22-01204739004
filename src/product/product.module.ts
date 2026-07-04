import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRepository } from 'src/DB/repositories/product.repository';
import { productModel } from 'src/DB/models/product.model';
import { categoryModel } from 'src/DB/models/category.model';
import { brandModel } from 'src/DB/models/brand.model';
import { subCategoryModel } from 'src/DB/models/sub-category.model';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import { BrandRepository } from 'src/DB/repositories/brand.repository';
import { SubCategoryRepository } from 'src/DB/repositories/sub-category.repository';
import { S3Service } from 'src/common/service/s3.service';

@Module({
  imports: [productModel, categoryModel, brandModel, subCategoryModel],
  controllers: [ProductController],
  providers: [
    ProductService, 
    ProductRepository, 
    CategoryRepository, 
    BrandRepository, 
    SubCategoryRepository, 
    S3Service
  ],
})
export class ProductModule {}
