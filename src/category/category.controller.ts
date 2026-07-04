import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  ValidationPipe,
  Put,
  Get,
  Query,
} from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto, IdDto, QueryDto } from './dto/category.dto';
import { CategoryService } from './category.service';
import { ResponceInterceptor } from 'src/common/interceptor/responce.interceptor';
import { RoleEnum } from 'src/common/enum/user.enum';
import { Auth } from 'src/common/decorator/auth.decorator';
import multerCloud from 'src/common/middleware/multer.cloud';
import { FileInterceptor } from '@nestjs/platform-express';
import type { HydratedUserDocument } from 'src/DB/models/user.model';
import { User } from 'src/common/decorator/user.decorator';

@Controller('category')
@UseInterceptors(ResponceInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Auth({ access_roles: [RoleEnum.admin] })
  @UseInterceptors(FileInterceptor('attachment', multerCloud()))
  async createCategory(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: CreateCategoryDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: HydratedUserDocument,
  ) {
    return this.categoryService.createCategory(body, file, user);
  }

  @Get()
  async getAllCategories(@Query() query: QueryDto) {
    return this.categoryService.getAllCategories(query);
  }

  @Put(':id')
  @Auth({ access_roles: [RoleEnum.admin] })
  @UseInterceptors(FileInterceptor('attachment', multerCloud()))
  async updateCategory(
    @Param() params: IdDto,
    @Body() body: UpdateCategoryDto,
    @User() user: HydratedUserDocument,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file?: Express.Multer.File,
  ) {
    // Note: If you want to update the file, you would handle it in the service.
    // For now, mirroring the brand functionality which mainly updates the body.
    return this.categoryService.updateCategory(body, params.id, user);
  }

  @Delete(':id/soft')
  @Auth({ access_roles: [RoleEnum.admin] })
  async softDeleteCategory(
    @Param() params: IdDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.categoryService.softDelete(params.id, user);
  }

  @Delete(':id/hard')
  @Auth({ access_roles: [RoleEnum.admin] })
  async hardDeleteCategory(
    @Param() params: IdDto,
    @User() user: HydratedUserDocument,
  ) {
    return this.categoryService.hardDelete(params.id, user);
  }
}
