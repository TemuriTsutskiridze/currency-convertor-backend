import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { CurrencyCodesService } from './currency-codes.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { firstValueFrom } from 'rxjs';

interface ExchangeRate {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateBuy?: number;
  rateSell?: number;
  rateCross?: number;
}

@Injectable()
export class CurrencyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly currencyCodesService: CurrencyCodesService,
  ) {}

  async convertCurrency(
    convertDto: ConvertCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    const rates: ExchangeRate[] = await this.getExchangeRates();
    // console.log(rates);
    const rate = this.getExchangeRate(
      rates,
      convertDto.sourceCurrency,
      convertDto.targetCurrency,
    );

    console.log(rate);

    return {
      sourceCurrency: convertDto.sourceCurrency,
      targetCurrency: convertDto.targetCurrency,
      sourceAmount: convertDto.amount,
      convertedAmount: convertDto.amount * rate,
      exchangeRate: rate,
      timestamp: new Date(),
    };
  }

  private async getExchangeRates(): Promise<ExchangeRate[]> {
    try {
      const response: AxiosResponse<ExchangeRate[]> = await firstValueFrom(
        this.httpService.get<ExchangeRate[]>(
          'https://api.monobank.ua/bank/currency',
        ),
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to fetch exchange rates',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private getExchangeRate(
    rates: ExchangeRate[],
    from: string,
    to: string,
  ): number {
    const fromCode = this.currencyCodesService.getNumericCode(from);
    const toCode = this.currencyCodesService.getNumericCode(to);

    if (fromCode === null || toCode === null) {
      throw new HttpException(
        'Unsupported currency code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const rateEntry = rates.find(
      (rate) =>
        rate.currencyCodeA === fromCode && rate.currencyCodeB === toCode,
    );

    if (!rateEntry) {
      throw new HttpException(
        'Exchange rate not found for the given currency pair',
        HttpStatus.NOT_FOUND,
      );
    }

    return rateEntry.rateBuy || 0;
  }
}
