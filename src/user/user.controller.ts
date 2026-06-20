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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

export class AppError extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}

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
    //   throw new AppError();
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
  getUsers(): object {
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
}
