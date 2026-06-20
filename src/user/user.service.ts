import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from 'src/DB/repositories/user.repository';
import { symmetricEncryption } from 'src/common/utils/security/encrypt.security';
import { generateOtp } from 'src/common/utils/security/code.generator';
import { emailEvents } from 'src/common/utils/email/email.events';
import { EventEnum } from 'src/common/enum/emailEvent.enum';
import { sendEmail } from 'src/common/utils/email/send.email';
import { otpTemplate } from 'src/common/utils/email/otp.template';
import { RedisService } from 'src/common/service/redis.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
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

    // 2. Generate OTP and store in Redis
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
}
