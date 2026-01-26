import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { CurrencyCodesService } from './currency-codes.service';
import { ErrorHandlingService } from './error-handling.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CacheService } from './cache.service';

@Module({
  imports: [HttpModule],
  controllers: [CurrencyController],
  providers: [
    CurrencyService,
    CurrencyCodesService,
    ErrorHandlingService,
    CircuitBreakerService,
    CacheService,
  ],
})
export class CurrencyModule {}
