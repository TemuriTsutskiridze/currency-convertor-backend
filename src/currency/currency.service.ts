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

    if (fromCode === toCode) {
      return 1;
    }

    let rateEntry = rates.find(
      (rate) =>
        rate.currencyCodeA === fromCode && rate.currencyCodeB === toCode,
    );

    if (rateEntry) {
      return (
        rateEntry.rateSell || rateEntry.rateBuy || rateEntry.rateCross || 0
      );
    }

    rateEntry = rates.find(
      (rate) =>
        rate.currencyCodeA === toCode && rate.currencyCodeB === fromCode,
    );

    if (rateEntry) {
      const rate =
        rateEntry.rateBuy || rateEntry.rateSell || rateEntry.rateCross;
      return rate ? 1 / rate : 0;
    }

    const UAH_CODE = 980;
    if (fromCode !== UAH_CODE && toCode !== UAH_CODE) {
      const fromToUAH = this.getRateToUAH(rates, fromCode);
      const toToUAH = this.getRateToUAH(rates, toCode);

      if (fromToUAH && toToUAH) {
        return fromToUAH / toToUAH;
      }
    }

    throw new HttpException(
      `Exchange rate not available for ${from} to ${to}`,
      HttpStatus.NOT_FOUND,
    );
  }

  private getRateToUAH(
    rates: ExchangeRate[],
    currencyCode: number,
  ): number | null {
    const UAH_CODE = 980;

    let rateEntry = rates.find(
      (rate) =>
        rate.currencyCodeA === currencyCode && rate.currencyCodeB === UAH_CODE,
    );

    if (rateEntry) {
      return (
        rateEntry.rateSell || rateEntry.rateBuy || rateEntry.rateCross || null
      );
    }

    rateEntry = rates.find(
      (rate) =>
        rate.currencyCodeA === UAH_CODE && rate.currencyCodeB === currencyCode,
    );

    if (rateEntry) {
      const rate =
        rateEntry.rateBuy || rateEntry.rateSell || rateEntry.rateCross;
      return rate ? 1 / rate : null;
    }

    return null;
  }
}
