import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ListContactSubmissionsQueryDto {
  @IsOptional()
  @IsIn(['inbox', 'spam', 'all'])
  status?: 'inbox' | 'spam' | 'all';

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  visitorId?: string;
}

export class UpdateContactSubmissionSpamDto {
  @IsBoolean()
  isSpam!: boolean;
}
