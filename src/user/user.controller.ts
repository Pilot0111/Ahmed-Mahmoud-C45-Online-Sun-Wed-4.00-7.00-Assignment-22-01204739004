import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  Query,
  Req,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { UserService } from './user.service';
import { HydratedUserDocument } from 'src/DB/models/user.model';
import { multerOptions, Store_Enum } from 'src/common/utils/multer.utlis';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { ResponceInterceptor } from 'src/common/interceptor/responce.interceptor';
import {
  ConfirmEmailDto,
  ForgetPasswordDto,
  PresignedUrlDto,
  ResendOtpDto,
  ResetPasswordDto,
  SendNotificationDto,
  SignInGmailDto,
  UpdatePasswordDto,
} from './dto/auth.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signUp')
  signUp(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: CreateUserDto,
  ) {
    if (body.age < 18 || body.age > 65) {
      throw new BadRequestException({
        message: 'Age must be at least 18 and at most 65',
        statusCode: 405,
      });
    }
    return this.userService.signUp(body);
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
  ) {
    return this.userService.login(body);
  }

  @Post('confirmEmail')
  confirmEmail(
    @Body()
    body: ConfirmEmailDto,
  ) {
    return this.userService.confirmEmail(body);
  }

  @Post('resendOtp')
  resendOtp(
    @Body()
    body: ResendOtpDto,
  ) {
    return this.userService.resendOtp(body);
  }

  @Post('signUpGmail')
  signUpGmail(
    @Body()
    body: SignInGmailDto,
  ) {
    return this.userService.signUpGmail(body);
  }

  @Post('forgetPassword')
  forgetPassword(
    @Body()
    body: ForgetPasswordDto,
  ) {
    return this.userService.forgetPassword(body);
  }

  @Post('resetPassword')
  resetPassword(
    @Body()
    body: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(body);
  }

  @Auth()
  @Patch('updatePassword')
  updatePassword(
    @User() user: any,
    @Body()
    body: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(user, body);
  }

  @Auth()
  @Get('profile')
  getProfile(@User() user: any) {
    return this.userService.getProfile(user);
  }

  @Auth()
  @Post('logout')
  logout(@Req() req: any) {
    return this.userService.logout(req);
  }

  @Auth()
  @Post('upload')
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      multerOptions({ store_type: Store_Enum.disk }),
    ),
  )
  uploadFile(@User() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadImage(user, file);
  }

  @Auth()
  @Post('uploadMulti')
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5,
      multerOptions({ store_type: Store_Enum.disk }),
    ),
  )
  uploadFiles(
    @User() user: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.userService.uploadImages(user, files);
  }

  @Auth()
  @Post('uploadFields')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'background', maxCount: 3 },
      ],
      multerOptions({ store_type: Store_Enum.disk }),
    ),
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

  @Auth()
  @Post('presignedUrl')
  getPresignedUrl(
    @User() user: any,
    @Body()
    body: PresignedUrlDto,
  ) {
    return this.userService.getPresignedUrl(user, body);
  }

  @Auth()
  @Post('profilePicPresignedUrl')
  getProfilePicPresignedUrl(
    @User() user: any,
    @Body()
    body: PresignedUrlDto,
  ) {
    return this.userService.getProfilePicPresignedUrl(user, body);
  }

  @Auth()
  @Get('file/*')
  getFile(
    @User() user: any,
    @Req() req: any,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    let key = req.params[0] || req.params['*'] || Object.values(req.params)[0];
    if (typeof key !== 'string') {
      const match = req.url.match(/\/file\/(.+?)(\?|$)/);
      key = match ? decodeURIComponent(match[1]) : '';
    }
    const isDownload = download === 'true';
    return this.userService.getFile(user, key, isDownload, res);
  }

  @Auth()
  @Get('files')
  getFiles(@User() user: any, @Query('folder') folder: string) {
    return this.userService.getFiles(user, folder);
  }

  @Auth()
  @Get('presignedUrlByKey/*')
  getPresignedUrlByKey(
    @User() user: any,
    @Req() req: any,
    @Query('download') download: string,
  ) {
    let key = req.params[0] || req.params['*'] || Object.values(req.params)[0];
    if (typeof key !== 'string') {
      const match = req.url.match(/\/presignedUrlByKey\/(.+?)(\?|$)/);
      key = match ? decodeURIComponent(match[1]) : '';
    }
    const isDownload = download === 'true';
    return this.userService.getPresignedUrlByKey(user, key, isDownload);
  }

  @Auth()
  @Delete('file')
  deleteFile(@User() user: HydratedUserDocument, @Body('key') key: string) {
    return this.userService.deleteFile(user, key);
  }

  @Auth()
  @Delete('files')
  deleteFiles(@User() user: HydratedUserDocument, @Body('keys') keys: string[]) {
    return this.userService.deleteFiles(user, keys);
  }

  @Auth()
  @Delete('folder/*')
  deleteFolder(@User() user: HydratedUserDocument, @Req() req: any) {
    let folderPath = req.params[0] || req.params['*'] || Object.values(req.params)[0];
    if (typeof folderPath !== 'string') {
      const match = req.url.match(/\/folder\/(.+?)(\?|$)/);
      folderPath = match ? decodeURIComponent(match[1]) : '';
    }
    return this.userService.deleteFolder(user, folderPath);
  }

  @Auth()
  @Post('fcmToken')
  saveFcmToken(@User() user: HydratedUserDocument, @Body('token') token: string) {
    return this.userService.saveFcmToken(user, token);
  }

  @Auth()
  @Post('sendNotification')
  sendNotification(
    @Body()
    body: SendNotificationDto,
  ) {
    return this.userService.sendNotification(body);
  }

  @Get()
  @Auth()
  @UseInterceptors(ResponceInterceptor)
  getUsers(@User() user: HydratedUserDocument) {
    return this.userService.getUsers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
  ) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
