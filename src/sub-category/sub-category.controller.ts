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
  ParseFilePipe,
} from '@nestjs/common';
import { SubCategoryService } from './sub-category.service';
import {
  CreateSubCategoryDto,
  IdDto,
  QueryDto,
  UpdateSubCategoryDto,
} from './dto/sub-category.dto';
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
    @Body()
    body: CreateSubCategoryDto,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
    @User() user: HydratedUserDocument,
  ) {
    return this.subCategoryService.createSubCategory(body, file, user);
  }

  @Auth()
  @Put('/:id')
  update(
    @Param() { id }: IdDto,
    @Body()
    body: UpdateSubCategoryDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.subCategoryService.updateSubCategory(body, id, user);
  }

  @Get()
  getAll(
    @Query()
    query: QueryDto,
  ) {
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
