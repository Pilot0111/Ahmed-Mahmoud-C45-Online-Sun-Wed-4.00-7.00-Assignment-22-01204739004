import { Body, Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller(`/api/v1`) // This is the base path for all routes in this controller
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(`hello`)
  getHello(): object {
    return this.appService.getHello();
  }

  @Get(`hello2`)
  getHello2(@Body() body: any, @Query() query: any): object {
    console.log(body, query);
    return this.appService.getHello2();
  }
}
