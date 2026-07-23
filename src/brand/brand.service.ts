import {
  BadGatewayException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { S3Service } from 'src/common/service/s3.service';
import { BrandRepository } from 'src/DB/repositories/brand.repository';
import { CreateBrandDto, UpdateBrandDto, QueryDto } from './dto/brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createBrand(
    body: CreateBrandDto,
    file: Express.Multer.File,
    user: HydratedUserDocument,
  ) {
    const { name, slogan } = body;
    // check if name is exsist
    if (await this.brandRepository.findOne({ filter: { name } })) {
      throw new Error('Brand name already exists');
    }
    // upload file logo
    const s3Key = await this.s3Service.uploadFile({
      file,
      path: `brands/${user._id}`,
    });

    if (!s3Key) {
      throw new Error('Failed to upload logo');
    }

    const logo = s3Key;
    // create brand
    const brand = await this.brandRepository.create({
      ...body,
      logo,
      slogan,
      createdBy: user._id,
    });
    if (!brand) {
      await this.s3Service.deleteFile(s3Key);
      throw new BadGatewayException('Failed to create brand');
    }
    return {
      message: 'Brand created successfully',
      brand,
    };
  }

  async updateBrand(
    body: UpdateBrandDto,
    id: Types.ObjectId,
    user: HydratedUserDocument,
  ) {
    const { name, slogan } = body;

    const brand = await this.brandRepository.findOne({ filter: { _id: id } });
    if (!brand) {
      throw new ConflictException('brand not exist');
    }

    if (name && name == brand.name) {
      throw new ConflictException(
        'name not change please make any change to update it',
      );
    }

    if (name && (await this.brandRepository.findOne({ filter: { name } }))) {
      throw new ConflictException('name already exist');
    }

    const updated = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brand._id },
      update: {
        ...(name ? { name } : undefined),
        ...(slogan ? { slogan } : undefined),
      },
    });

    return { message: 'Brand updated successfully', brand: updated };
  }

  async getAllBrands(query: QueryDto) {
    const { page, limit, search } = query;
    const pageSize = limit ?? 10;
    const pageNo = page ?? 1;

    const searchFilter: any = {
      deletedAt: { $exists: false },
    };

    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slogan: { $regex: search, $options: 'i' } },
      ];
    }

    const data = await this.brandRepository.paginate({
      page: pageNo,
      limit: pageSize,
      search: searchFilter,
    });

    return data;
  }

  async softDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const brand = await this.brandRepository.findOne({
      filter: { _id: id, deletedAt: { $exists: false } },
    });
    if (!brand) {
      throw new ConflictException('Brand does not exist or is already deleted');
    }

    const updated = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brand._id },
      update: {
        deletedAt: new Date(),
        deletedBy: user._id,
      },
    });

    return { message: 'Brand soft deleted successfully', brand: updated };
  }

  async hardDelete(id: Types.ObjectId, user: HydratedUserDocument) {
    const brand = await this.brandRepository.findOne({ filter: { _id: id } });
    if (!brand) {
      throw new ConflictException('Brand does not exist');
    }

    if (brand.logo) {
      await this.s3Service.deleteFile(brand.logo);
    }

    await this.brandRepository.findOneAndDelete({ filter: { _id: id } });

    return { message: 'Brand hard deleted successfully' };
  }
}
