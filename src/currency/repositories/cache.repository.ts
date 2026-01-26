import { Injectable } from '@nestjs/common';
import {
  ExchangeRateRepository,
  ExchangeRate,
} from './exchange-rate.repository';
import { CacheService } from '../cache.service';

@Injectable()
export class CacheRepository implements ExchangeRateRepository {
  private readonly cacheKey = 'exchange_rates';

  constructor(private readonly cacheService: CacheService) {}

  async getRates(): Promise<ExchangeRate[] | null> {
    const data = (await this.cacheService.get(this.cacheKey)) as string | null;
    return data ? (JSON.parse(data) as ExchangeRate[]) : null;
  }

  async saveRates(rates: ExchangeRate[]): Promise<void> {
    await this.cacheService.set(this.cacheKey, JSON.stringify(rates), 300);
  }
}
