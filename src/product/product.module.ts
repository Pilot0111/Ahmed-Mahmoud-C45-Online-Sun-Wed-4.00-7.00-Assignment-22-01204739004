import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRepository } from 'src/DB/repositories/product.repository';
import { productModel } from 'src/DB/models/product.model';
import { CategoryModule } from 'src/category/category.module';
import { BrandModule } from 'src/brand/brand.module';
import { SubCategoryModule } from 'src/sub-category/sub-category.module';

@Module({
  imports: [productModel, CategoryModule, BrandModule, SubCategoryModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
  ],
  exports: [ProductRepository],
})
export class ProductModule {}
