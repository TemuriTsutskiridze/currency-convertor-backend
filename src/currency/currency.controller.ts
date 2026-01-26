import { Controller, Post, Body, Get } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { CacheService } from './cache.service';

@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    private readonly cacheService: CacheService,
  ) {}

  @Post('convert')
  async convertCurrency(
    @Body() convertDto: ConvertCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    return await this.currencyService.convertCurrency(convertDto);
  }

  // @Get('test')
  // async test() {
  //   return await this.cacheService.test();
  // }
}
