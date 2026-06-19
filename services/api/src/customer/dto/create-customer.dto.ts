import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsPhoneNumber('MY')
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;
}
