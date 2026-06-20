import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return { message: 'Hello in my app!' };
  }

  getHello2(): object {
    return { message: 'Hello World2!' };
  }
}
