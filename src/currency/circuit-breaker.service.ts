import { Injectable, Logger } from '@nestjs/common';
import Opossum from 'opossum';

type CircuitBreakerEvent = 'open' | 'halfOpen' | 'close' | 'reject';

interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  volumeThreshold: number;
}

interface CircuitBreakerInstance {
  on(event: CircuitBreakerEvent, handler: () => void): void;
  fire<T>(action: () => Promise<T>): Promise<T>;
  opened: boolean;
  halfOpen: boolean;
}

type CircuitBreakerConstructor = new (
  action: (requestFunction: () => Promise<unknown>) => Promise<unknown>,
  options: CircuitBreakerOptions,
) => CircuitBreakerInstance;

const getEnvNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuitBreaker: CircuitBreakerInstance;

  constructor() {
    this.initializeCircuitBreaker();
  }

  private initializeCircuitBreaker() {
    const options: CircuitBreakerOptions = {
      timeout: getEnvNumber(process.env.CB_TIMEOUT_MS, 10000),
      errorThresholdPercentage: getEnvNumber(
        process.env.CB_ERROR_THRESHOLD_PERCENT,
        50,
      ),
      resetTimeout: getEnvNumber(process.env.CB_RESET_TIMEOUT_MS, 30000),
      rollingCountTimeout: getEnvNumber(
        process.env.CB_ROLLING_COUNT_TIMEOUT_MS,
        60000,
      ),
      rollingCountBuckets: getEnvNumber(
        process.env.CB_ROLLING_COUNT_BUCKETS,
        10,
      ),
      volumeThreshold: getEnvNumber(process.env.CB_VOLUME_THRESHOLD, 5),
    };

    const CircuitBreakerClass = Opossum as unknown as CircuitBreakerConstructor;
    this.circuitBreaker = new CircuitBreakerClass(
      (requestFunction) => this.executeRequest(requestFunction),
      options,
    );

    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker is open');
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.log('Circuit breaker is half-open');
    });

    this.circuitBreaker.on('close', () => {
      this.logger.log('Circuit breaker is closed');
    });

    this.circuitBreaker.on('reject', () => {
      this.logger.warn('Circuit breaker rejected request');
    });
  }

  private async executeRequest(
    requestFunction: () => Promise<unknown>,
  ): Promise<unknown> {
    return requestFunction();
  }

  public executeWithCircuitBreaker<T>(
    requestFunction: () => Promise<T>,
  ): Promise<T> {
    return this.circuitBreaker.fire(requestFunction);
  }

  getCircuitState(): string {
    return this.circuitBreaker.opened
      ? 'OPEN'
      : this.circuitBreaker.halfOpen
        ? 'HALF_OPEN'
        : 'CLOSED';
  }
}
