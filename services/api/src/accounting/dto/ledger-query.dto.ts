import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class LedgerQueryDto {
  @IsString()
  accountId: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  from?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  to?: Date;
}
