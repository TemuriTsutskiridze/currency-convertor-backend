import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { CurrencyCodesService } from './currency-codes.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CacheRepository } from './repositories/cache.repository';
import { ApiRepository } from './repositories/api.repository';
import { ConversionStrategy } from './strategies/conversion.strategy';
import { ExchangeRate } from './repositories/exchange-rate.repository';

@Injectable()
export class CurrencyService {
  constructor(
    private readonly currencyCodesService: CurrencyCodesService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly cacheRepository: CacheRepository,
    private readonly apiRepository: ApiRepository,
    @Inject('CONVERSION_STRATEGIES')
    private readonly strategies: ConversionStrategy[],
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
    const cached = await this.cacheRepository.getRates();
    if (cached) {
      return cached;
    }

    try {
      const fresh = await this.circuitBreakerService.executeWithCircuitBreaker(
        () => this.apiRepository.getRates(),
      );

      await this.cacheRepository.saveRates(fresh);
      return fresh;
    } catch (error) {
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

    for (const strategy of this.strategies) {
      if (strategy.canHandle(rates, fromCode, toCode)) {
        const rate = strategy.convert(rates, fromCode, toCode);
        if (rate > 0) {
          return rate;
        }
      }
    }

    throw new HttpException(
      `Exchange rate not available for ${from} to ${to}`,
      HttpStatus.NOT_FOUND,
    );
  }
}
