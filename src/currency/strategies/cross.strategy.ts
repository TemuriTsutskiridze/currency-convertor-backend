import { Injectable } from '@nestjs/common';
import { ConversionStrategy } from './conversion.strategy';
import { ExchangeRate } from '../repositories/exchange-rate.repository';

@Injectable()
export class CrossStrategy implements ConversionStrategy {
  private readonly UAH = 980;

  canHandle(rates: ExchangeRate[], fromCode: number, toCode: number): boolean {
    if (fromCode === this.UAH || toCode === this.UAH) return false;

    const fromToUah = this.getUahRate(rates, fromCode);
    const toToUah = this.getUahRate(rates, toCode);

    return !!(fromToUah && toToUah);
  }

  convert(rates: ExchangeRate[], fromCode: number, toCode: number): number {
    const fromToUah = this.getUahRate(rates, fromCode);
    const toToUah = this.getUahRate(rates, toCode);

    return fromToUah && toToUah ? fromToUah / toToUah : 0;
  }

  private getUahRate(rates: ExchangeRate[], code: number): number {
    let entry = rates.find(
      (r) => r.currencyCodeA === code && r.currencyCodeB === this.UAH,
    );
    if (entry) {
      return entry.rateSell || entry.rateBuy || entry.rateCross || 0;
    }

    entry = rates.find(
      (r) => r.currencyCodeA === this.UAH && r.currencyCodeB === code,
    );
    if (entry) {
      const rate = entry.rateBuy || entry.rateSell || entry.rateCross;
      return rate ? 1 / rate : 0;
    }

    return 0;
  }
}
