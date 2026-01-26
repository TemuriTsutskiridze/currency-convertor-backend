import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { CurrencyCodesService } from './currency-codes.service';
import { ErrorHandlingService } from './error-handling.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CacheService } from './cache.service';

import { CacheRepository } from './repositories/cache.repository';
import { ApiRepository } from './repositories/api.repository';

import { DirectStrategy } from './strategies/direct.strategy';
import { ReverseStrategy } from './strategies/reverse.strategy';
import { CrossStrategy } from './strategies/cross.strategy';

@Module({
  imports: [HttpModule],
  controllers: [CurrencyController],
  providers: [
    CurrencyCodesService,
    ErrorHandlingService,
    CircuitBreakerService,
    CacheService,
    CacheRepository,
    ApiRepository,
    DirectStrategy,
    ReverseStrategy,
    CrossStrategy,
    {
      provide: 'CONVERSION_STRATEGIES',
      useFactory: (
        direct: DirectStrategy,
        reverse: ReverseStrategy,
        cross: CrossStrategy,
      ) => [direct, reverse, cross],
      inject: [DirectStrategy, ReverseStrategy, CrossStrategy],
    },
    CurrencyService,
  ],
})
export class CurrencyModule {}
