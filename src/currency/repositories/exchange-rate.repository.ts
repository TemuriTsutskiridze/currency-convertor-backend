export interface ExchangeRate {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateBuy?: number;
  rateSell?: number;
  rateCross?: number;
}

export interface ExchangeRateRepository {
  getRates(): Promise<ExchangeRate[] | null>;
  saveRates(rates: ExchangeRate[]): Promise<void>;
}
