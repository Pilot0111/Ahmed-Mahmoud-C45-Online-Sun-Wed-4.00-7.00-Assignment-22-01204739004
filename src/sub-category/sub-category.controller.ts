import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  Query,
  Delete,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import { CreateSubCategoryDto, IdDto, QueryDto, UpdateSubCategoryDto } from './dto/sub-category.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multerCloud from 'src/common/middleware/multer.cloud';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { User } from 'src/common/decorator/user.decorator';

@Controller('sub-category')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Auth()
  @Post()
  @UseInterceptors(FileInterceptor('image', multerCloud()))
  create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CreateSubCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @User() user: HydratedUserDocument,
  ) {
    return this.subCategoryService.createSubCategory(body, file, user);
  }

  @Auth()
  @Put('/:id')
  update(
    @Param() { id }: IdDto,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: UpdateSubCategoryDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.subCategoryService.updateSubCategory(body, id, user);
  }

  @Get()
  getAll(@Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) query: QueryDto) {
    return this.subCategoryService.getAllSubCategories(query);
  }

  @Auth()
  @Delete('/soft/:id')
  softDelete(@Param() { id }: IdDto, @User() user: HydratedUserDocument) {
    return this.subCategoryService.softDelete(id, user);
  }

  @Auth()
  @Delete('/hard/:id')
  hardDelete(@Param() { id }: IdDto, @User() user: HydratedUserDocument) {
    return this.subCategoryService.hardDelete(id, user);
  }
}
