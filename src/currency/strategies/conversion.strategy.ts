import { ExchangeRate } from '../repositories/exchange-rate.repository';

export interface ConversionStrategy {
  canHandle(rates: ExchangeRate[], fromCode: number, toCode: number): boolean;
  convert(rates: ExchangeRate[], fromCode: number, toCode: number): number;
}
