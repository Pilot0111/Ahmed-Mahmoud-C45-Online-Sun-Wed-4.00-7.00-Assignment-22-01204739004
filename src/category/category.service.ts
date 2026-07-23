import {
  BadGatewayException,
  ConflictException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { S3Service } from 'src/common/service/s3.service';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import { BrandRepository } from 'src/DB/repositories/brand.repository';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryDto,
} from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createCategory(
    body: CreateCategoryDto,
    file: Express.Multer.File,
    user: HydratedUserDocument,
  ) {
    const { name, brands } = body;

    if (await this.categoryRepository.findOne({ filter: { name } })) {
      throw new ConflictException('Category name already exists');
    }

    const strictIds = [...new Set(brands || [])].map((id: any) =>
      Types.ObjectId.createFromHexString(id),
    );

    if (brands && brands.length > 0) {
      const foundBrands = await this.brandRepository.find({
        filter: { _id: { $in: strictIds } },
      });
      if (foundBrands.length !== strictIds.length) {
        throw new NotFoundException('some of id not found');
      }
    }

    const s3Key = await this.s3Service.uploadFile({
      file,
      path: `category`,
    });

    if (!s3Key) {
      throw new Error('Failed to upload image');
    }

    const image = s3Key;

    const category = await this.categoryRepository.create({
      name,
      brands: strictIds,
      image,
      createdBy: user._id,
    });
    if (!category) {
      await this.s3Service.deleteFile(s3Key);
      throw new BadGatewayException('Failed to create category');
    }
    return {
      message: 'Category created successfully',
      category,
    };
  }

  async updateCategory(
    body: UpdateCategoryDto,
    id: Types.ObjectId,
    user: HydratedUserDocument,
  ) {
    const { name, brands } = body;

    const category = await this.categoryRepository.findOne({
      filter: { _id: id },
    });
    if (!category) {
      throw new ConflictException('category not exist');
    }

    if (name && name == category.name) {
      throw new ConflictException(
        'name not change please make any change to update it',
      );
    }

    if (name && (await this.categoryRepository.findOne({ filter: { name } }))) {
      throw new ConflictException('name already exist');
    }

    const updated = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: category._id },
      update: {
        ...(name ? { name } : undefined),
        ...(brands ? { brands } : undefined),
      },
    });

    return { message: 'Category updated successfully', category: updated };
  }

  async getAllCategories(query: QueryDto) {
    const { page, limit, search } = query;
    const pageSize = limit ?? 10;
    const pageNo = page ?? 1;

    const searchFilter: any = {
      deletedAt: { $exists: false },
    };

    if (search) {
      searchFilter.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    const data = await this.categoryRepository.paginate({
      page: pageNo,
      limit: pageSize,
      search: searchFilter,
    });

    return data;
  }

  async softDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const category = await this.categoryRepository.findOne({
      filter: { _id: id, deletedAt: { $exists: false } },
    });
    if (!category) {
      throw new ConflictException(
        'Category does not exist or is already deleted',
      );
    }

    const updated = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: category._id },
      update: {
        deletedAt: new Date(),
        deletedBy: user._id,
      },
    });

    return { message: 'Category soft deleted successfully', category: updated };
  }

  async hardDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const category = await this.categoryRepository.findOne({
      filter: { _id: id },
    });
    if (!category) {
      throw new ConflictException('Category does not exist');
    }

    if (category.image) {
      await this.s3Service.deleteFile(category.image);
    }

    await this.categoryRepository.findOneAndDelete({ filter: { _id: id } });

    return { message: 'Category hard deleted successfully' };
  }
}
