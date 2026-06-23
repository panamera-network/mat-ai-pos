import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TrialBalanceQueryDto {
  @IsString()
  @IsOptional()
  outletId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  asOf?: Date;
}
