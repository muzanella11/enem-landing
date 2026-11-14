import {
  CONTACT_EMAIL_MAX,
  CONTACT_FIELDS,
  CONTACT_FULLNAME_MAX,
  CONTACT_FULLNAME_MIN,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MAX_URLS,
  CONTACT_MESSAGE_MIN,
  CONTACT_PHONE_PATTERN,
  type ContactField,
} from '@enem-landing/shared-definitions';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  MaxUrls,
  NoLinkMarkup,
  Trim,
  TrimLowercase,
} from './contact-validators.js';

/**
 * Browser-side signals. The web BFF already drops malformed values
 * (`sanitizeClientSignals`), so these checks only guard the API itself.
 */
export class ClientSignalsDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(35)
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  screenWidth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  screenHeight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400_000)
  fillDurationMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  keystrokeCount?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CONTACT_FIELDS.length)
  @IsIn(CONTACT_FIELDS, { each: true })
  pastedFields?: ContactField[];

  @IsOptional()
  @IsBoolean()
  hadPointerMovement?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;
}

/*
 * Every message starts with the field name and contains no comma: the web
 * form splits the joined 400 message on ", " and maps each part back to its
 * field.
 */
export class CreateContactSubmissionDto {
  @Trim()
  @IsString({ message: 'fullname is required' })
  @Length(CONTACT_FULLNAME_MIN, CONTACT_FULLNAME_MAX, {
    message: `fullname must be ${CONTACT_FULLNAME_MIN} to ${CONTACT_FULLNAME_MAX} characters`,
  })
  @MaxUrls(0, { message: 'fullname must not contain links' })
  fullname!: string;

  @TrimLowercase()
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(CONTACT_EMAIL_MAX, {
    message: `email must be at most ${CONTACT_EMAIL_MAX} characters`,
  })
  email!: string;

  @Trim()
  @IsString({ message: 'phoneNumber is required' })
  @Matches(CONTACT_PHONE_PATTERN, {
    message: 'phoneNumber must be 8 to 20 digits (spaces and dashes allowed)',
  })
  phoneNumber!: string;

  @Trim()
  @IsString({ message: 'message is required' })
  @Length(CONTACT_MESSAGE_MIN, CONTACT_MESSAGE_MAX, {
    message: `message must be ${CONTACT_MESSAGE_MIN} to ${CONTACT_MESSAGE_MAX} characters`,
  })
  @MaxUrls(CONTACT_MESSAGE_MAX_URLS, {
    message: `message must contain at most ${CONTACT_MESSAGE_MAX_URLS} links`,
  })
  @NoLinkMarkup({ message: 'message must not contain HTML or BBCode links' })
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  captchaToken?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientSignalsDto)
  client?: ClientSignalsDto;
}
