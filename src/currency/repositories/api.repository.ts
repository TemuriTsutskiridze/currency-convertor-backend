import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, retry, catchError, throwError, timer } from 'rxjs';
import {
  ExchangeRateRepository,
  ExchangeRate,
} from './exchange-rate.repository';
import { ErrorHandlingService } from '../error-handling.service';

@Injectable()
export class ApiRepository implements ExchangeRateRepository {
  private readonly logger = new Logger(ApiRepository.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly httpService: HttpService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  async getRates(): Promise<ExchangeRate[]> {
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

  saveRates(rates: ExchangeRate[]): void {
    throw new Error('Cannot save to API repository');
  }
}
