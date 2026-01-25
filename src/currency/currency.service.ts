import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  async convertCurrency() {
    return {
      message: 'Currency converted successfully',
    };
  }
}
