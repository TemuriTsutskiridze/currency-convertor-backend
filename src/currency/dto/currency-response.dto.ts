export class CurrencyResponseDto {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  timestamp: Date;
}
