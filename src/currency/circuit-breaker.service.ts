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

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuitBreaker: CircuitBreakerInstance;

  constructor() {
    this.initializeCircuitBreaker();
  }

  private initializeCircuitBreaker() {
    const options: CircuitBreakerOptions = {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 60000,
      rollingCountBuckets: 10,
      volumeThreshold: 5,
    };

    const CircuitBreakerCtor = Opossum as unknown as CircuitBreakerConstructor;
    this.circuitBreaker = new CircuitBreakerCtor(
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
