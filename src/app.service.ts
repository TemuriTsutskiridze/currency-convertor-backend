import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getConvertor(): string {
    return 'Currency Convertor';
  }
}
