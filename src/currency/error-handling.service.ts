import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      this.logger.warn('Network error', error.message);
      return true;
    }

    if (error.response.status >= 500) {
      this.logger.warn('Server error', error.response.status);
      return true;
    }

    if (error.response.status === 429) {
      this.logger.warn('Rate limited');
      return true;
    }

    this.logger.error('Client error', error.response.status);

    return false;
  }

  getRetryDelay(retryNum: number): number {
    return Math.min(1000 * Math.pow(2, retryNum), 10000); // 1s, 2s, 4s, 8s, 10s max
  }

  logError(error: AxiosError, context: string): void {
    this.logger.error(`Error in ${context}: ${error.message}`, {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });
  }
}
