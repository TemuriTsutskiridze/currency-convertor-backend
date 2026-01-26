import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, retry, catchError, throwError, timer } from 'rxjs';
import { CurrencyCodesService } from './currency-codes.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { ErrorHandlingService } from './error-handling.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CacheService } from './cache.service';

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
  private readonly logger = new Logger(CurrencyService.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly httpService: HttpService,
    private readonly currencyCodesService: CurrencyCodesService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly cacheService: CacheService,
  ) {}

  async convertCurrency(
    convertDto: ConvertCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    const rates = await this.getRates();
    const rate = this.calculateRate(
      rates,
      convertDto.sourceCurrency,
      convertDto.targetCurrency,
    );

    return {
      sourceCurrency: convertDto.sourceCurrency,
      targetCurrency: convertDto.targetCurrency,
      sourceAmount: convertDto.amount,
      convertedAmount: convertDto.amount * rate,
      exchangeRate: rate,
      timestamp: new Date(),
    };
  }

  private async getRates(): Promise<ExchangeRate[]> {
    const cached = await this.getCachedRates();
    if (cached) {
      return cached;
    }

    const fresh = await this.getApiRates();
    await this.saveToCache(fresh);
    return fresh;
  }

  private async getCachedRates(): Promise<ExchangeRate[] | null> {
    const data = await this.cacheService.get('exchange_rates');
    return data ? JSON.parse(data) : null;
  }

  private async saveToCache(rates: ExchangeRate[]): Promise<void> {
    await this.cacheService.set('exchange_rates', JSON.stringify(rates), 300);
  }

  private async getApiRates(): Promise<ExchangeRate[]> {
    try {
      return await this.circuitBreakerService.executeWithCircuitBreaker(() =>
        this.fetchWithRetry(),
      );
    } catch (error) {
      this.errorHandlingService.logError(
        error as AxiosError,
        'Get exchange rates',
      );

      if (this.circuitBreakerService.getCircuitState() === 'OPEN') {
        throw new HttpException(
          'Service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'Failed to fetch exchange rates',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async fetchWithRetry(): Promise<ExchangeRate[]> {
    return firstValueFrom(
      this.httpService
        .get<ExchangeRate[]>('https://api.monobank.ua/bank/currency')
        .pipe(
          retry({
            count: this.MAX_RETRIES,
            delay: (error, retryCount) => {
              if (!this.errorHandlingService.isRetryableError(error)) {
                return throwError(() => error);
              }

              const delay = this.errorHandlingService.getRetryDelay(retryCount);
              this.logger.warn(
                `Retry ${retryCount + 1}/${this.MAX_RETRIES} in ${delay}ms`,
              );
              return timer(delay);
            },
          }),
          catchError((error: AxiosError) => {
            this.errorHandlingService.logError(error, 'API request failed');
            return throwError(() => error);
          }),
        ),
    ).then((response) => response.data);
  }

  private calculateRate(
    rates: ExchangeRate[],
    from: string,
    to: string,
  ): number {
    const fromCode = this.currencyCodesService.getNumericCode(from);
    const toCode = this.currencyCodesService.getNumericCode(to);

    if (!fromCode || !toCode) {
      throw new HttpException(
        'Unsupported currency code',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (fromCode === toCode) {
      return 1;
    }

    let rate = this.getDirectRate(rates, fromCode, toCode);
    if (rate) return rate;

    rate = this.getReverseRate(rates, fromCode, toCode);
    if (rate) return rate;

    rate = this.getCrossRate(rates, fromCode, toCode);
    if (rate) return rate;

    throw new HttpException(
      `Exchange rate not available for ${from} to ${to}`,
      HttpStatus.NOT_FOUND,
    );
  }

  private getDirectRate(
    rates: ExchangeRate[],
    fromCode: number,
    toCode: number,
  ): number {
    const entry = rates.find(
      (r) => r.currencyCodeA === fromCode && r.currencyCodeB === toCode,
    );
    if (entry) {
      return entry.rateSell || entry.rateBuy || entry.rateCross || 0;
    }
    return 0;
  }

  private getReverseRate(
    rates: ExchangeRate[],
    fromCode: number,
    toCode: number,
  ): number {
    const entry = rates.find(
      (r) => r.currencyCodeA === toCode && r.currencyCodeB === fromCode,
    );
    if (entry) {
      const rate = entry.rateBuy || entry.rateSell || entry.rateCross;
      return rate ? 1 / rate : 0;
    }
    return 0;
  }

  private getCrossRate(
    rates: ExchangeRate[],
    fromCode: number,
    toCode: number,
  ): number {
    const UAH = 980;
    if (fromCode === UAH || toCode === UAH) return 0;

    const fromToUah = this.getUahRate(rates, fromCode);
    const toToUah = this.getUahRate(rates, toCode);

    return fromToUah && toToUah ? fromToUah / toToUah : 0;
  }

  private getUahRate(rates: ExchangeRate[], code: number): number {
    const UAH = 980;

    let entry = rates.find(
      (r) => r.currencyCodeA === code && r.currencyCodeB === UAH,
    );
    if (entry) {
      return entry.rateSell || entry.rateBuy || entry.rateCross || 0;
    }

    entry = rates.find(
      (r) => r.currencyCodeA === UAH && r.currencyCodeB === code,
    );
    if (entry) {
      const rate = entry.rateBuy || entry.rateSell || entry.rateCross;
      return rate ? 1 / rate : 0;
    }

    return 0;
  }
}
