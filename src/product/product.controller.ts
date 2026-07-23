import {
  Controller,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Get,
  Query,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  IdDto,
  QueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import multerCloud from 'src/common/middleware/multer.cloud';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { User } from 'src/common/decorator/user.decorator';
import { RoleEnum } from 'src/common/enum/user.enum';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Auth({ access_roles: [RoleEnum.admin] })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },
      ],
      multerCloud(),
    ),
  )
  create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateProductDto,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      subImages?: Express.Multer.File[];
    },
    @User() user: HydratedUserDocument,
  ) {
    return this.productService.createProduct(body, files, user);
  }

  @Auth({ access_roles: [RoleEnum.admin] })
  @Put('/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 5 },
      ],
      multerCloud(),
    ),
  )
  update(
    @Param() { id }: IdDto,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: UpdateProductDto,
    @User() user: HydratedUserDocument,
    @UploadedFiles()
    files?: {
      mainImage?: Express.Multer.File[];
      subImages?: Express.Multer.File[];
    },
  ) {
    return this.productService.updateProduct(body, id, user, files);
  }

  @Get()
  getAll(
    @Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    query: QueryDto,
  ) {
    return this.productService.getAllProducts(query);
  }

  @Auth({ access_roles: [RoleEnum.admin] })
  @Delete('/soft/:id')
  softDelete(@Param() { id }: IdDto, @User() user: HydratedUserDocument) {
    return this.productService.softDelete(id, user);
  }

  @Auth({ access_roles: [RoleEnum.admin] })
  @Delete('/hard/:id')
  hardDelete(@Param() { id }: IdDto, @User() user: HydratedUserDocument) {
    return this.productService.hardDelete(id, user);
  }

  @Auth({ access_roles: [RoleEnum.user, RoleEnum.admin] })
  @Patch('/wishList/:id')
  addToWishList(
    @Param() { id }: IdDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.productService.addToWishList(user, id);
  }
}
