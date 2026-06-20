import { ConflictException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
import { comparePassword } from 'src/common/utils/security/hash.security';
import { TokenService } from 'src/common/utils/security/toke.security';
import { JWT_ACCESS_SECRET_USER, JWT_REFRESH_SECRET_USER } from 'src/config/config.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  async getUsers() {
    return await this.userRepository.find();
  }

  async signUp(body: CreateUserDto) {
    const { firstName, lastName, email, password, age, gender, phone, address } = body;

    // 1. Check if email already exists
    const existingUser = await this.userRepository.findOne({ filter: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // 2. Max OTP Tries Logic
    const blockKey = this.redisService.blockKeyOtp(email);
    const isBlocked = await this.redisService.get({ key: blockKey });
    if (isBlocked) {
      throw new HttpException('Too many OTP attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const maxTriesKey = this.redisService.maxOtpTriesKey(email);
    let attempts = await this.redisService.get({ key: maxTriesKey });
    attempts = attempts ? parseInt(attempts) : 0;

    if (attempts >= 3) {
      await this.redisService.setValue({ key: blockKey, value: 'blocked', ttl: 30 * 60 });
      await this.redisService.deleteKey(maxTriesKey);
      throw new HttpException('Maximum OTP attempts reached. Blocked for 30 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (attempts === 0) {
      await this.redisService.setValue({ key: maxTriesKey, value: '1', ttl: 15 * 60 });
    } else {
      await this.redisService.increment(maxTriesKey);
    }

    // 3. Generate OTP and store in Redis
    const otp = generateOtp();
    const otpKey = this.redisService.generateOtpKey({ email, subject: EventEnum.confirmEmail });
    await this.redisService.setValue({ key: otpKey, value: otp, ttl: 10 * 60 }); // Valid for 10 mins

    // 3. Emit event to send email asynchronously
    emailEvents.emit(EventEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: 'Confirm your email',
        html: otpTemplate({ userName: firstName, otp }),
      });
    });

    // 4. Create the user — password is hashed automatically by the pre('save') hook
    const user = await this.userRepository.create({
      firstName,
      lastName,
      email,
      password,  // plain text — hook hashes it before saving
      age,
      gender,
      phone: phone ? symmetricEncryption(phone) : undefined,
      address,
    });

    return {
      message: 'User registered successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  findOne(id: number): object {
    return { message: `This action returns a #${id} user` };
  }

  update(id: number, updateUserDto: any): object {
    return {
      message: `This action updates a #${id} user with data: ${JSON.stringify(updateUserDto)}`,
    };
  }

  remove(id: number): object {
    return { message: `This action removes a #${id} user` };
  }

  async login(body: LoginDto) {
    const { email, password } = body;

    const blockKey = this.redisService.blockKeyLogin(email);
    const isBlocked = await this.redisService.get({ key: blockKey });
    if (isBlocked) {
      throw new HttpException('Too many login attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const maxTriesKey = this.redisService.maxLoginTriesKey(email);
    let attempts = await this.redisService.get({ key: maxTriesKey });
    attempts = attempts ? parseInt(attempts) : 0;

    const user = await this.userRepository.findOne({ filter: { email } });
    if (!user || !comparePassword({ PlainText: password, cipherText: user.password })) {
      if (attempts >= 4) {
        await this.redisService.setValue({ key: blockKey, value: 'blocked', ttl: 15 * 60 });
        await this.redisService.deleteKey(maxTriesKey);
        throw new HttpException('Maximum login attempts reached. Account blocked for 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
      }

      if (attempts === 0) {
        await this.redisService.setValue({ key: maxTriesKey, value: '1', ttl: 15 * 60 });
      } else {
        await this.redisService.increment(maxTriesKey);
      }
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    if (user.isDeleted) {
      throw new HttpException('Account is suspended or deleted', HttpStatus.FORBIDDEN);
    }

    await this.redisService.deleteKey(maxTriesKey);

    const accessToken = await this.tokenService.generateToken({
      payload: { id: user._id, role: user.role },
      secret_key: JWT_ACCESS_SECRET_USER,
      options: { expiresIn: '1h' },
    });

    const refreshToken = await this.tokenService.generateToken({
      payload: { id: user._id, role: user.role },
      secret_key: JWT_REFRESH_SECRET_USER,
      options: { expiresIn: '7d' },
    });

    return {
      message: 'Login successful',
      tokens: { accessToken, refreshToken },
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
      },
    };
  }
}
