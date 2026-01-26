import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuitBreaker: CircuitBreaker<any[], any>;

  constructor() {
    this.initializeCircuitBreaker();
  }

  private initializeCircuitBreaker() {
    const options = {
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      rollingCountTimeout: 60000,
      rollingCountBuckets: 10,
      volumeThreshold: 5,
    };

    this.circuitBreaker = new CircuitBreaker(
      this.executeRequest.bind(this),
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

  private async executeRequest<T>(
    requestFunction: () => Promise<T>,
  ): Promise<T> {
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

  getStats() {
    return {
      state: this.getCircuitState(),
      failures: this.circuitBreaker.stats.failures,
      successes: this.circuitBreaker.stats.successes,
      rejects: this.circuitBreaker.stats.rejects,
    };
  }
}
