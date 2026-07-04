import { BadGatewayException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { S3Service } from 'src/common/service/s3.service';
import { ProductRepository } from 'src/DB/repositories/product.repository';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import { BrandRepository } from 'src/DB/repositories/brand.repository';
import { SubCategoryRepository } from 'src/DB/repositories/sub-category.repository';
import { CreateProductDto, UpdateProductDto, QueryDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createProduct(
    body: CreateProductDto,
    files: { mainImage?: Express.Multer.File[], subImages?: Express.Multer.File[] },
    user: HydratedUserDocument,
  ) {
    let { name, description, price, discount, brandId, categoryId, subCategoryId } = body;
    
    price = price - (price * ((discount || 0) / 100));
    // Validate relationships
    const brand = await this.brandRepository.findOne({ filter: { _id: brandId, deletedAt: { $exists: false } } });
    if (!brand) throw new NotFoundException('Brand not found');

    const category = await this.categoryRepository.findOne({ filter: { _id: categoryId, deletedAt: { $exists: false } } });
    if (!category) throw new NotFoundException('Category not found');

    if (subCategoryId) {
      const subCategory = await this.subCategoryRepository.findOne({ filter: { _id: subCategoryId, deletedAt: { $exists: false } } });
      if (!subCategory) throw new NotFoundException('SubCategory not found');
    }

    if (await this.productRepository.findOne({ filter: { name } })) {
      throw new ConflictException('Product name already exists');
    }

    if (!files?.mainImage?.length) {
      throw new ConflictException('Main image is required');
    }

    // Upload Main Image
    const mainImageKey = await this.s3Service.uploadFile({
      file: files.mainImage[0],
      path: `products/${user._id}/main`,
    });

    if (!mainImageKey) {
      throw new Error('Failed to upload main image');
    }

    // Upload Sub Images
    let subImagesKeys: string[] = [];
    if (files?.subImages?.length) {
      subImagesKeys = await this.s3Service.uploadFiles({
        files: files.subImages,
        path: `products/${user._id}/subImages`,
      });
    }
    
    const product = await this.productRepository.create({ 
      ...body, 
      price,
      mainImage: mainImageKey,
      subImages: subImagesKeys,
      createdBy: user._id 
    });

    if (!product) {
      await this.s3Service.deleteFile(mainImageKey);
      if (subImagesKeys.length > 0) {
        await this.s3Service.deleteFiles(subImagesKeys);
      }
      throw new BadGatewayException('Failed to create product');
    }

    return {
      message: 'Product created successfully',
      product,
    };
  }

  async updateProduct(
    body: UpdateProductDto, 
    id: Types.ObjectId, 
    user: HydratedUserDocument,
    files?: { mainImage?: Express.Multer.File[], subImages?: Express.Multer.File[] },
  ) {
    let { name, description, price, discount, brandId, categoryId, subCategoryId } = body;

    const product = await this.productRepository.findOne({ filter: { _id: id } });
    if (!product) throw new NotFoundException('Product not exist');

    if (brandId) {
      const brand = await this.brandRepository.findOne({ filter: { _id: brandId, deletedAt: { $exists: false } } });
      if (!brand) throw new NotFoundException('Brand not found');
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({ filter: { _id: categoryId, deletedAt: { $exists: false } } });
      if (!category) throw new NotFoundException('Category not found');
    }

    if (subCategoryId) {
      const subCategory = await this.subCategoryRepository.findOne({ filter: { _id: subCategoryId, deletedAt: { $exists: false } } });
      if (!subCategory) throw new NotFoundException('SubCategory not found');
    }

    if (name && name == product.name) {
      throw new ConflictException('name not change please make any change to update it');
    }

    if (name && (await this.productRepository.findOne({ filter: { name } }))) {
      throw new ConflictException('name already exist');
    }

    if (price !== undefined || discount !== undefined) {
      const currentPrice = price ?? product.price;
      const currentDiscount = discount ?? product.discount;
      price = currentPrice - (currentPrice * (currentDiscount / 100));
    }

    let mainImageKey = product.mainImage;
    if (files?.mainImage?.length) {
      const key = await this.s3Service.uploadFile({
        file: files.mainImage[0],
        path: `products/${user._id}/main`,
      });
      if (key) {
        mainImageKey = key;
        await this.s3Service.deleteFile(product.mainImage);
      }
    }

    let subImagesKeys = [...product.subImages];
    if (files?.subImages?.length) {
      if (product.subImages.length > 0) {
        await this.s3Service.deleteFiles(product.subImages);
      }
      subImagesKeys = await this.s3Service.uploadFiles({
        files: files.subImages,
        path: `products/${user._id}/subImages`,
      });
    }

    const updated = await this.productRepository.findOneAndUpdate({
      filter: { _id: product._id },
      update: {
        ...body,
        ...(price !== undefined ? { price } : {}),
        mainImage: mainImageKey,
        subImages: subImagesKeys,
        updatedBy: user._id,
      },
    });

    return { message: 'Product updated successfully', product: updated };
  }

  async getAllProducts(query: QueryDto) {
    const { page, limit, search } = query;
    const pageSize = limit ?? 10;
    const pageNo = page ?? 1;

    const searchFilter: any = {
      deletedAt: { $exists: false },
    };

    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const data = await this.productRepository.paginate({
      page: pageNo,
      limit: pageSize,
      search: searchFilter,
    });

    return data;
  }

  async softDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const product = await this.productRepository.findOne({ filter: { _id: id, deletedAt: { $exists: false } } });
    if (!product) {
      throw new ConflictException('Product does not exist or is already deleted');
    }

    const updated = await this.productRepository.findOneAndUpdate({
      filter: { _id: product._id },
      update: {
        deletedAt: new Date(),
        deletedBy: user._id,
      },
    });

    return { message: 'Product soft deleted successfully', product: updated };
  }

  async hardDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const product = await this.productRepository.findOne({ filter: { _id: id } });
    if (!product) {
      throw new ConflictException('Product does not exist');
    }

    if (product.mainImage) {
      await this.s3Service.deleteFile(product.mainImage);
    }
    if (product.subImages && product.subImages.length > 0) {
      await this.s3Service.deleteFiles(product.subImages);
    }

    await this.productRepository.findOneAndDelete({ filter: { _id: id } });

    return { message: 'Product hard deleted successfully' };
  }
}
