import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyCodesService {
  private readonly currencyMap = new Map([
    ['USD', 840],
    ['EUR', 978],
    ['UAH', 980],
    ['GBP', 826],
    ['CNY', 156],
    ['CHF', 756],
    ['CAD', 124],
    ['AUD', 36],
    ['JPY', 392],
    ['PLN', 985],
  ]);

  getNumericCode(currencyCode: string): number | null {
    return this.currencyMap.get(currencyCode.toUpperCase()) || null;
  }
}
