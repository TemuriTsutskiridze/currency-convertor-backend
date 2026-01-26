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

    // TODO: fix ts errors later

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.circuitBreaker = new CircuitBreaker(
      this.executeRequest.bind(this),
      options,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker is open');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.circuitBreaker.on('halfOpen', () => {
      this.logger.log('Circuit breaker is half-open');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.circuitBreaker.on('close', () => {
      this.logger.log('Circuit breaker is closed');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return this.circuitBreaker.fire(requestFunction);
  }

  getCircuitState(): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.circuitBreaker.opened
      ? 'OPEN'
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.circuitBreaker.halfOpen
        ? 'HALF_OPEN'
        : 'CLOSED';
  }

  getStats() {
    return {
      state: this.getCircuitState(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      failures: this.circuitBreaker.stats.failures,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      successes: this.circuitBreaker.stats.successes,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      rejects: this.circuitBreaker.stats.rejects,
    };
  }
}
