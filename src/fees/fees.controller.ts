import { Controller, Get, Query } from '@nestjs/common';
import { FeesService } from './fees.service';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  getAll() {
    return this.feesService.getAll();
  }

  @Get('colleges')
  getCollegeNames() {
    return this.feesService.getCollegeNames();
  }

  @Get('college')
  getByCollege(@Query('college') college: string) {
    return this.feesService.getByCollege(college);
  }
}