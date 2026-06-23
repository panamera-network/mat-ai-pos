import { IsString } from 'class-validator';

export class PostJournalEntryDto {
  @IsString()
  id: string;
}
