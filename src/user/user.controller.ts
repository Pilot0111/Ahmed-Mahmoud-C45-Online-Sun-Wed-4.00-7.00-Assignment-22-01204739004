import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  HttpException,
  BadRequestException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UserService } from './user.service';
import { multerOptions, Store_Enum } from 'src/common/utils/multer.utlis';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { ResponceInterceptor } from 'src/common/interceptor/responce.interceptor';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signUp')
  signUp(
    @Body(
      new ValidationPipe({
        whitelist: true, // Strip properties that do not have any decorators
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
        // transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
        // transformOptions: { enableImplicitConversion: true }, // Enable implicit type conversion
        // dismissDefaultMessages: false, // Ensure messages from validators are shown
        // skipMissingProperties: false, // Do not skip validation for missing properties
        // validationError: { target: false }, // Do not return validation errors for the target
        // skipNullProperties: false, // Skip validation for null properties
        // skipUndefinedProperties: false, // Skip validation for undefined properties
        // forbidUnknownValues: true, // Forbid unknown values
      }),
    )
    Body: CreateUserDto,
  ): object {
    if (Body.age < 18 || Body.age >65) {
      throw new BadRequestException({
        message: 'Age must be at least 18 and at most 65',
        statusCode: 405,
      });
    }
    // if (Body.age > 20) {
    //   throw new BadRequestException();
    // }
    return this.userService.signUp(Body);
  }

  @Post('login')
  login(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: LoginDto,
  ): object {
    return this.userService.login(body);
  }

  @Get()
  @Auth()
  @UseInterceptors(ResponceInterceptor)
  getUsers(@User() user: any): object {
    // You now have direct access to the authenticated user here!
    console.log('Authenticated User:', user);
    return this.userService.getUsers();
  }

  @Get(':id')
  findOne(@Param('id') id: string): object {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateUserDto: any,
  ): object {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): object {
    return this.userService.remove(+id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('attachment', multerOptions({ store_type: Store_Enum.disk }))
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadFile(file);
  }

  @Post('uploadMulti')
  @UseInterceptors(
    FilesInterceptor('attachments', 5, multerOptions({ store_type: Store_Enum.disk }))
  )
  uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    return files;
  }

  @Post('uploadFields')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'background', maxCount: 3 },
      ],
      multerOptions({ store_type: Store_Enum.disk })
    )
  )
  uploadFileFields(
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      background?: Express.Multer.File[];
    },
  ) {
    return files;
  }
}
