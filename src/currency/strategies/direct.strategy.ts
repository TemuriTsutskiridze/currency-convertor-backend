import { Injectable } from '@nestjs/common';
import { ConversionStrategy } from './conversion.strategy';
import { ExchangeRate } from '../repositories/exchange-rate.repository';

@Injectable()
export class DirectStrategy implements ConversionStrategy {
  canHandle(rates: ExchangeRate[], fromCode: number, toCode: number): boolean {
    return !!rates.find(
      (r) => r.currencyCodeA === fromCode && r.currencyCodeB === toCode,
    );
  }

  convert(rates: ExchangeRate[], fromCode: number, toCode: number): number {
    const entry = rates.find(
      (r) => r.currencyCodeA === fromCode && r.currencyCodeB === toCode,
    );
    if (entry) {
      return entry.rateSell || entry.rateBuy || entry.rateCross || 0;
    }
    return 0;
  }
}
