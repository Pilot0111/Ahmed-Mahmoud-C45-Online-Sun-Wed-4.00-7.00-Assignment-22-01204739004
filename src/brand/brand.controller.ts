import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Res,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  ValidationPipe,
  Put,
} from '@nestjs/common';
import { CreateBrandDto, UpdateBrandDto, IdDto } from './dto/brand.dto';
import { BrandService } from './brand.service';
import { Response } from 'express';
import { ResponceInterceptor } from 'src/common/interceptor/responce.interceptor';
import { RoleEnum } from 'src/common/enum/user.enum';
import { Auth } from 'src/common/decorator/auth.decorator';
import multerCloud from 'src/common/middleware/multer.cloud';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/common/service/s3.service';
import type { HydratedUserDocument } from 'src/DB/models/user.model';
import { User } from 'src/common/decorator/user.decorator';

@Controller('brand')
@UseInterceptors(ResponceInterceptor)
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @Auth({ access_roles: [RoleEnum.admin] })
  @UseInterceptors(FileInterceptor('attachment', multerCloud()))
  async createBrand(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CreateBrandDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: HydratedUserDocument,
  ) {
    return this.brandService.createBrand(body, file, user);
  }

  @Put(':id')
  @Auth({ access_roles: [RoleEnum.admin] })
  @UseInterceptors(FileInterceptor('attachment', multerCloud()))
  async updateBrand(
    @Param() params: IdDto,
    @Body() body: UpdateBrandDto,
    @User() user: HydratedUserDocument,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file?: Express.Multer.File,
  ) {
    return this.brandService.updateBrand(body, params.id, user);
  }

  @Delete(':id/soft')
  @Auth({ access_roles: [RoleEnum.admin] })
  async softDeleteBrand(
    @Param() params: IdDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.brandService.softDelete(params.id, user);
  }

  @Delete(':id/hard')
  @Auth({ access_roles: [RoleEnum.admin] })
  async hardDeleteBrand(
    @Param() params: IdDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.brandService.hardDelete(params.id, user);
  }
}
