import { Controller, Post, Body } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post('convert')
  async convertCurrency(
    @Body() convertDto: ConvertCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    return await this.currencyService.convertCurrency(convertDto);
  }
}
