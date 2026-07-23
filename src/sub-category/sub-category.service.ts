import {
  BadGatewayException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { S3Service } from 'src/common/service/s3.service';
import { SubCategoryRepository } from 'src/DB/repositories/sub-category.repository';
import { CategoryRepository } from 'src/DB/repositories/category.repository';
import {
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  QueryDto,
} from './dto/sub-category.dto';

@Injectable()
export class SubCategoryService {
  constructor(
    private readonly subCategoryRepository: SubCategoryRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createSubCategory(
    body: CreateSubCategoryDto,
    file: Express.Multer.File,
    user: HydratedUserDocument,
  ) {
    const { name, categoryId } = body;

    // Check if category exists
    const category = await this.categoryRepository.findOne({
      filter: { _id: categoryId, deletedAt: { $exists: false } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (await this.subCategoryRepository.findOne({ filter: { name } })) {
      throw new ConflictException('SubCategory name already exists');
    }

    const s3Key = await this.s3Service.uploadFile({
      file,
      path: `sub-category`,
    });

    if (!s3Key) {
      throw new Error('Failed to upload image');
    }

    const image = s3Key;

    const subCategory = await this.subCategoryRepository.create({
      ...body,
      image,
      createdBy: user._id,
    });

    if (!subCategory) {
      await this.s3Service.deleteFile(s3Key);
      throw new BadGatewayException('Failed to create sub-category');
    }

    return {
      message: 'SubCategory created successfully',
      subCategory,
    };
  }

  async updateSubCategory(
    body: UpdateSubCategoryDto,
    id: Types.ObjectId,
    user: HydratedUserDocument,
  ) {
    const { name, categoryId } = body;

    const subCategory = await this.subCategoryRepository.findOne({
      filter: { _id: id },
    });
    if (!subCategory) {
      throw new NotFoundException('SubCategory not exist');
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        filter: { _id: categoryId, deletedAt: { $exists: false } },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (name && name == subCategory.name) {
      throw new ConflictException(
        'name not change please make any change to update it',
      );
    }

    if (
      name &&
      (await this.subCategoryRepository.findOne({ filter: { name } }))
    ) {
      throw new ConflictException('name already exist');
    }

    const updated = await this.subCategoryRepository.findOneAndUpdate({
      filter: { _id: subCategory._id },
      update: {
        ...(name ? { name } : undefined),
        ...(categoryId ? { categoryId } : undefined),
        updatedBy: user._id,
      },
    });

    return {
      message: 'SubCategory updated successfully',
      subCategory: updated,
    };
  }

  async getAllSubCategories(query: QueryDto) {
    const { page, limit, search } = query;
    const pageSize = limit ?? 10;
    const pageNo = page ?? 1;

    const searchFilter: any = {
      deletedAt: { $exists: false },
    };

    if (search) {
      searchFilter.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    const data = await this.subCategoryRepository.paginate({
      page: pageNo,
      limit: pageSize,
      search: searchFilter,
    });

    return data;
  }

  async softDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const subCategory = await this.subCategoryRepository.findOne({
      filter: { _id: id, deletedAt: { $exists: false } },
    });
    if (!subCategory) {
      throw new ConflictException(
        'SubCategory does not exist or is already deleted',
      );
    }

    const updated = await this.subCategoryRepository.findOneAndUpdate({
      filter: { _id: subCategory._id },
      update: {
        deletedAt: new Date(),
        deletedBy: user._id,
      },
    });

    return {
      message: 'SubCategory soft deleted successfully',
      subCategory: updated,
    };
  }

  async hardDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const subCategory = await this.subCategoryRepository.findOne({
      filter: { _id: id },
    });
    if (!subCategory) {
      throw new ConflictException('SubCategory does not exist');
    }

    if (subCategory.image) {
      await this.s3Service.deleteFile(subCategory.image);
    }

    await this.subCategoryRepository.findOneAndDelete({ filter: { _id: id } });

    return { message: 'SubCategory hard deleted successfully' };
  }
}
