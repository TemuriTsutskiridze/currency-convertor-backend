import { Injectable } from '@nestjs/common';
import { ConversionStrategy } from './conversion.strategy';
import { ExchangeRate } from '../repositories/exchange-rate.repository';

@Injectable()
export class ReverseStrategy implements ConversionStrategy {
  canHandle(rates: ExchangeRate[], fromCode: number, toCode: number): boolean {
    return !!rates.find(
      (r) => r.currencyCodeA === toCode && r.currencyCodeB === fromCode,
    );
  }

  convert(rates: ExchangeRate[], fromCode: number, toCode: number): number {
    const entry = rates.find(
      (r) => r.currencyCodeA === toCode && r.currencyCodeB === fromCode,
    );
    if (entry) {
      const rate = entry.rateBuy || entry.rateSell || entry.rateCross;
      return rate ? 1 / rate : 0;
    }
    return 0;
  }
}
