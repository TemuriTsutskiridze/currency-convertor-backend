import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @IsNotEmpty()
  @IsString()
  sourceCurrency: string;

  @IsNotEmpty()
  @IsString()
  targetCurrency: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;
}
