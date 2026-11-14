import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/** Server-to-server payload from enem-landing-api's ContactSubmissionsService (InternalApiGuard, not user input directly). */
export class SendContactSubmissionEmailDto {
  @IsString()
  @IsNotEmpty()
  fullname!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  /**
   * False skips the auto-reply to the submitter (daily auto-reply quota
   * reached); the admin notification is always sent.
   */
  @IsOptional()
  @IsBoolean()
  sendConfirmation?: boolean;
}
