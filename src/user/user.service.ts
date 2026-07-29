import {
  ConflictException,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from 'src/DB/repositories/user.repository';
import { symmetricEncryption } from 'src/common/utils/security/encrypt.security';
import { generateOtp } from 'src/common/utils/security/code.generator';
import { emailEvents } from 'src/common/utils/email/email.events';
import { EventEnum } from 'src/common/enum/emailEvent.enum';
import { sendEmail } from 'src/common/utils/email/send.email';
import { otpTemplate } from 'src/common/utils/email/otp.template';
import { RedisService } from 'src/common/service/redis.service';
import { LoginDto } from './dto/login.dto';
import {
  comparePassword,
  hashPassword,
} from 'src/common/utils/security/hash.security';
import { TokenService } from 'src/common/utils/security/toke.security';
import { S3Service } from 'src/common/service/s3.service';
import { Request, Response } from 'express';
import { NotificationService } from 'src/common/service/notification.service';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { randomUUID } from 'node:crypto';
import { providerEnum } from 'src/common/enum/provider.enum';
import { RoleEnum } from 'src/common/enum/user.enum';
import { Store_Enum } from 'src/common/utils/multer.utlis';
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
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Centralized logic for generating, storing, and sending OTPs.
   * Handles max tries and blocking logic.
   */
  private async sendOtpFlow({
    email,
    userName,
    subject,
    isResend = false,
  }: {
    email: string;
    userName: string;
    subject: EventEnum;
    isResend?: boolean;
  }) {
    const blockKey = this.redisService.blockKeyOtp(email);
    const triesKey = this.redisService.maxOtpTriesKey(email);

    // 1. Check if user is blocked
    const isBlocked = await this.redisService.ttl(blockKey);
    if (isBlocked && isBlocked > 0) {
      throw new HttpException(
        `Too many attempts. Please try again after ${isBlocked} seconds`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Handle Tries Logic
    let currentTries = await this.redisService.get({ key: triesKey });

    if (isResend && currentTries !== null) {
      if (parseInt(currentTries) <= 1) {
        await this.redisService.setValue({
          key: blockKey,
          value: 'blocked',
          ttl: 3600,
        }); // Block for 1 hour
        await this.redisService.deleteKey(triesKey);
        throw new HttpException(
          'Max attempts reached. You are blocked for 1 hour',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      currentTries = String(parseInt(currentTries) - 1);
    } else {
      currentTries = '3'; // Default tries for new requests
    }

    // 3. Generate and Store OTP
    const otp = generateOtp();
    await this.redisService.setValue({
      key: this.redisService.generateOtpKey({ email, subject }),
      value: hashPassword({ plainText: String(otp) }),
      ttl: 600,
    });

    // 4. Update Tries in Redis
    await this.redisService.setValue({
      key: triesKey,
      value: currentTries,
      ttl: 600,
    });

    // 5. Emit Email Event
    emailEvents.emit(subject, async () => {
      const displaySubject =
        subject === EventEnum.confirmEmail
          ? 'Email Confirmation'
          : 'Password Reset';
      await sendEmail({
        to: email,
        subject: `${displaySubject} - Social_Media App`,
        html: otpTemplate({
          userName,
          otp,
          subject: displaySubject,
        }),
      });
    });
  }

  async signUp(body: CreateUserDto) {
    const {
      firstName,
      lastName,
      email,
      password,
      address,
      phone,
      age,
      gender,
      role,
    } = body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.userRepository.findOne({
      filter: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.userRepository.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password, // Plain text — hook hashes it before saving
      address,
      phone: phone ? symmetricEncryption(phone) : undefined,
      age,
      gender,
      role: role || RoleEnum.user,
    });

    await this.sendOtpFlow({
      email: normalizedEmail,
      userName: `${firstName} ${lastName}`,
      subject: EventEnum.confirmEmail,
    });

    return {
      message:
        'User signed up successfully. Please check your email for the confirmation code.',
      user,
    };
  }

  async resendOtp(body: ResendOtpDto) {
    const { email, subject = EventEnum.confirmEmail } = body;
    const normalizedEmail = email.toLowerCase();

    const user = await this.userRepository.findOne({
      filter: { email: normalizedEmail },
    });
    if (!user) throw new NotFoundException('User not found');

    if (subject === EventEnum.confirmEmail && user.confirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    await this.sendOtpFlow({
      email: normalizedEmail,
      userName: user.userName,
      subject: subject,
      isResend: true,
    });

    return { message: 'OTP resent successfully' };
  }

  async confirmEmail(body: ConfirmEmailDto) {
    const { email, code } = body;
    const normalizedEmail = email.toLowerCase();

    const otpKey = this.redisService.generateOtpKey({
      email: normalizedEmail,
      subject: EventEnum.confirmEmail,
    });
    const otpValue = await this.redisService.get({ key: otpKey });

    if (!otpValue) throw new NotFoundException('OTP not found or expired');

    const match = comparePassword({
      PlainText: code,
      cipherText: String(otpValue),
    });

    if (!match) throw new UnauthorizedException('OTP is incorrect');

    const user = await this.userRepository.findOne({
      filter: {
        email: normalizedEmail,
        confirmed: { $ne: true },
        provider: providerEnum.system,
      },
    });

    if (!user)
      throw new NotFoundException('User not found or already confirmed');

    user.confirmed = true;
    await user.save();

    await this.redisService.deleteKey(otpKey);
    await this.redisService.deleteKey(
      this.redisService.maxOtpTriesKey(normalizedEmail),
    );

    return { message: 'Email confirmed successfully' };
  }

  async login(body: LoginDto) {
    const { email, password } = body;
    const normalizedEmail = email.toLowerCase();

    const blockKey = this.redisService.blockKeyLogin(normalizedEmail);
    const isBlocked = await this.redisService.ttl(blockKey);

    if (isBlocked !== undefined && isBlocked > 0) {
      throw new ForbiddenException(
        `Account temporarily banned. Please try again after ${isBlocked} seconds`,
      );
    }

    const user = await this.userRepository.findOne({
      filter: { email: normalizedEmail },
    });

    if (!user || !user.confirmed) {
      throw new UnauthorizedException(
        'Invalid credentials or email not confirmed',
      );
    }

    const match = comparePassword({
      PlainText: password,
      cipherText: user.password,
    });

    if (!match) {
      const maxTriesKey = this.redisService.maxLoginTriesKey(normalizedEmail);
      await this.redisService.increment(maxTriesKey);
      const failed_tries = await this.redisService.get({ key: maxTriesKey });

      if (parseInt(failed_tries) >= 5) {
        await this.redisService.setValue({
          key: blockKey,
          value: '1',
          ttl: 300,
        }); // 5 min block
        await this.redisService.deleteKey(maxTriesKey);
        throw new ForbiddenException(
          'Account temporarily banned due to 5 consecutive failed login attempts',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isDeleted) {
      throw new ForbiddenException('Account is suspended or deleted');
    }

    await this.redisService.deleteKey(
      this.redisService.maxLoginTriesKey(normalizedEmail),
    );

    const accessToken = await this.tokenService.generateToken({
      payload: { id: user._id, email: user.email, role: user.role },
      secret_key: process.env.JWT_ACCESS_SECRET_USER || 'access-secret',
      options: { expiresIn: '1h', jwtid: randomUUID() },
    });

    const refreshToken = await this.tokenService.generateToken({
      payload: { id: user._id, email: user.email, role: user.role },
      secret_key: process.env.JWT_REFRESH_SECRET_USER || 'refresh-secret',
      options: { expiresIn: '1y', jwtid: randomUUID() },
    });

    return {
      message: 'User signed in successfully',
      tokens: { accessToken, refreshToken },
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
      },
    };
  }

  async signUpGmail(body: SignInGmailDto) {
    const { idToken } = body;
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new BadRequestException('Invalid Google token');

    const {
      email: googleEmail,
      email_verified,
      name,
      picture,
      given_name,
      family_name,
    } = payload;
    if (!googleEmail)
      throw new BadRequestException('Email not found in Google token');

    const finalEmail = googleEmail.toLowerCase();
    let user = await this.userRepository.findOne({
      filter: { email: finalEmail },
    });

    if (!user) {
      user = await this.userRepository.create({
        firstName: given_name || name,
        lastName: family_name || '',
        email: finalEmail,
        confirmed: email_verified,
        provider: providerEnum.google,
        profilePicture: picture,
      });
    }

    if (user.provider === providerEnum.system) {
      throw new BadRequestException(
        'Please login with your email and password',
      );
    }

    const accessToken = await this.tokenService.generateToken({
      payload: { id: user._id, email: user.email, role: user.role },
      secret_key: process.env.JWT_ACCESS_SECRET_USER || 'access-secret',
      options: {
        expiresIn: '1d',
        jwtid: randomUUID(),
        issuer: 'Social_Media_App',
      },
    });

    const refreshToken = await this.tokenService.generateToken({
      payload: { id: user._id, email: user.email, role: user.role },
      secret_key: process.env.JWT_REFRESH_SECRET_USER || 'refresh-secret',
      options: {
        expiresIn: '7d',
        jwtid: randomUUID(),
        issuer: 'Social_Media_App',
      },
    });

    return {
      message: 'Gmail login successful',
      tokens: { accessToken, refreshToken },
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
      },
    };
  }

  async forgetPassword(body: ForgetPasswordDto) {
    const { email } = body;
    const normalizedEmail = email.toLowerCase();
    const user = await this.userRepository.findOne({
      filter: { email: normalizedEmail },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.sendOtpFlow({
      email: normalizedEmail,
      userName: user.userName,
      subject: EventEnum.forgetPassword,
    });

    return { message: 'Reset code sent to your email' };
  }

  async resetPassword(body: ResetPasswordDto) {
    const { email, code, newPassword } = body;
    const normalizedEmail = email.toLowerCase();

    const otpKey = this.redisService.generateOtpKey({
      email: normalizedEmail,
      subject: EventEnum.forgetPassword,
    });

    const otpValue = await this.redisService.get({ key: otpKey });

    if (!otpValue)
      throw new NotFoundException('Reset code expired or not found');

    const match = comparePassword({
      PlainText: code,
      cipherText: String(otpValue),
    });
    if (!match) throw new UnauthorizedException('Invalid reset code');

    const user = await this.userRepository.findOne({
      filter: { email: normalizedEmail },
    });
    if (!user) throw new NotFoundException('User not found');

    // The pre-save hook will hash the password
    user.password = newPassword;
    await user.save();

    await this.redisService.deleteKey(otpKey);

    return { message: 'Password reset successfully' };
  }

  async updatePassword(user: any, body: UpdatePasswordDto) {
    const { oldPassword, newPassword } = body;

    const fullUser = await this.userRepository.findOne({
      filter: { _id: user._id },
    });
    if (!fullUser) throw new NotFoundException('User not found');

    const match = comparePassword({
      PlainText: oldPassword,
      cipherText: fullUser.password,
    });
    if (!match) throw new UnauthorizedException('Old password is incorrect');

    // Hook will hash it automatically
    fullUser.password = newPassword;
    await fullUser.save();

    return { message: 'Password updated successfully' };
  }

  async getProfile(user: any) {
    const fullUser = await this.userRepository.findOne({
      filter: { _id: user._id },
    });
    return {
      message: 'User profile retrieved successfully',
      data: fullUser,
    };
  }

  async logout(req: any) {
    const { decoded, user } = req;

    if (decoded && decoded.jti) {
      await this.redisService.setValue({
        key: this.redisService.generateRevokeTokenKey(
          user._id.toString(),
          decoded.jti,
        ),
        value: decoded.jti,
        ttl: decoded.exp - Math.floor(Date.now() / 1000),
      });
    }

    return { message: 'Logged out successfully' };
  }

  async uploadImage(user: any, file: Express.Multer.File) {
    const FILE_SIZE_THRESHOLD_FOR_LARGE_UPLOAD = 5 * 1024 * 1024; // 5MB

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let key: string | undefined;
    const s3UploadOptions = {
      file,
      path: `Users/${user._id}/uploads`,
      store_type: Store_Enum.disk,
    };

    if (file.size > FILE_SIZE_THRESHOLD_FOR_LARGE_UPLOAD) {
      key = await this.s3Service.uploadLargeFile(s3UploadOptions);
    } else {
      key = await this.s3Service.uploadFile(s3UploadOptions);
    }

    if (!key) {
      throw new HttpException(
        'Failed to upload image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      message: 'Image uploaded successfully',
      data: { ...file, key },
    };
  }

  async uploadImages(user: any, files: Express.Multer.File[]) {
    const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const hasLargeFile = files.some((file) => file.size > FILE_SIZE_THRESHOLD);

    const keys = await this.s3Service.uploadFiles({
      files,
      path: `Users/${user._id}/multiuploads`,
      store_type: Store_Enum.disk,
      isLargeFile: hasLargeFile,
    });

    return {
      message: 'Images uploaded successfully',
      data: { count: keys.length, keys },
    };
  }

  async getPresignedUrl(user: any, body: PresignedUrlDto) {
    const { fileName, contentType } = body;
    const result = await this.s3Service.creatPresignedUrl({
      fileName,
      contentType,
      path: `Users/${user._id}/presigneduploads`,
    });

    return { message: 'Presigned URL generated successfully', data: result };
  }

  async getProfilePicPresignedUrl(user: any, body: PresignedUrlDto) {
    const { fileName, contentType } = body;

    const result = await this.s3Service.creatPresignedUrl({
      fileName,
      contentType,
      path: `Users/${user._id}/profile`,
    });

    const fullUser = await this.userRepository.findOne({
      filter: { _id: user._id },
    });
    if (fullUser) {
      fullUser.profilePicture = result.Key;
      await fullUser.save();
    }

    return {
      message: 'Profile picture presigned URL generated successfully',
      data: result,
    };
  }

  async getFile(
    user: any,
    keyParam: string | string[],
    isDownload: boolean,
    res: Response,
  ) {
    let key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;
    if (key) key = key.replace(/^\/+/, '');

    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // Authorization
    const userPath = `Social_Media_App/Users/${user._id}/`;
    const publicPath = `Social_Media_App/Users/uploads/`;

    // if (!key.startsWith(userPath) && !key.startsWith(publicPath)) {
    //   throw new ForbiddenException("Unauthorized to access this file");
    // }

    const result = await this.s3Service.getFile({ key });

    // Set headers
    res.set('Content-Type', result.ContentType || 'application/octet-stream');
    if (result.ContentLength) {
      res.set('Content-Length', result.ContentLength.toString());
    }
    res.set('cross-origin-resource-policy', 'cross-origin');

    const filename = key.split('/').pop();
    const encodedFilename = encodeURIComponent(filename || 'file');
    const disposition = isDownload
      ? `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
      : 'inline';
    res.set('Content-Disposition', disposition);

    if (result.Body instanceof Readable) {
      await pipeline(result.Body as any, res as any);
    } else {
      throw new NotFoundException('File body is empty');
    }
  }

  async getFiles(user: any, folderQuery: string) {
    const folder = (folderQuery || '').replace(/^\/+|\/+$/g, '');
    const userBasePath = `Users/${user._id}${folder ? `/${folder}` : ''}`;

    const files = await this.s3Service.listFiles({ path: userBasePath });

    return { message: 'Files retrieved successfully', data: files };
  }

  async getPresignedUrlByKey(
    user: any,
    keyParam: string | string[],
    isDownload: boolean,
  ) {
    let key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;
    if (key) key = key.replace(/^\/+/, '');

    if (!key) throw new BadRequestException('File key is required');

    // const userPath = `Social_Media_App/Users/${user._id}/`;
    // const publicPath = `Social_Media_App/Users/uploads/`;
    // if (!key.startsWith(userPath) && !key.startsWith(publicPath)) {
    //   throw new ForbiddenException("Unauthorized to access this file");
    // }

    const url = await this.s3Service.getPresignedUrlByKey({
      key,
      expiresIn: 3600, // 1 hour
      download: isDownload,
    });

    return { message: 'Presigned URL generated successfully', data: { url } };
  }

  async deleteFile(user: any, key: string) {
    if (!key) throw new BadRequestException('File key is required');

    // const userPath = `Social_Media_App/Users/${user._id}/`;
    // if (!key.startsWith(userPath)) {
    //   throw new ForbiddenException("Unauthorized to delete this file");
    // }

    await this.s3Service.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  async deleteFiles(user: any, keys: string[]) {
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      throw new BadRequestException('File keys are required');
    }

    // const userPath = `Social_Media_App/Users/${user._id}/`;
    // for (const key of keys) {
    //   if (!key.startsWith(userPath)) {
    //     throw new ForbiddenException(`Unauthorized to delete file: ${key}`);
    //   }
    // }

    await this.s3Service.deleteFiles(keys);
    return { message: 'Files deleted successfully' };
  }

  async deleteFolder(user: any, folderPathParam: string | string[]) {
    const folderPath = Array.isArray(folderPathParam)
      ? folderPathParam.join('/')
      : folderPathParam;
    if (!folderPath) throw new BadRequestException('Folder path is required');

    const userBasePath = `Users/${user._id}/${folderPath.replace(/^\/+|\/+$/g, '')}`;
    const files = await this.s3Service.listFiles({ path: userBasePath });

    if (files.length === 0) {
      return { message: 'Folder is already empty or does not exist' };
    }

    const keys = files
      .map((file) => file.Key)
      .filter((key): key is string => !!key);
    await this.s3Service.deleteFiles(keys);

    return {
      message: `Successfully deleted folder '${folderPath}' and its ${keys.length} files.`,
    };
  }

  async saveFcmToken(user: any, token: string) {
    const fullUser = await this.userRepository.findOne({
      filter: { _id: user._id },
    });
    if (fullUser && token) {
      if (!fullUser.fcmTokens) fullUser.fcmTokens = [];
      if (!fullUser.fcmTokens.includes(token)) {
        fullUser.fcmTokens.push(token);
        await fullUser.save();
      }
    }
    return { message: 'FCM Token saved successfully' };
  }

  async sendNotification(body: SendNotificationDto) {
    const { token, title, body: msgBody } = body;

    const response = await this.notificationService.sendPushNotification({
      token,
      title,
      body: msgBody,
    });

    return {
      message: 'Notification sent successfully',
      data: { messageId: response },
    };
  }

  getUsers() {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return { message: `This action returns a #${id} user` };
  }

  update(id: number, updateUserDto: any) {
    return {
      message: `This action updates a #${id} user with data: ${JSON.stringify(updateUserDto)}`,
    };
  }

  remove(id: number) {
    return { message: `This action removes a #${id} user` };
  }
}
