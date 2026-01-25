import { Controller } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { Post } from '@nestjs/common';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post('convert')
  async convertCurrency() {
    return await this.currencyService.convertCurrency();
  }
}
