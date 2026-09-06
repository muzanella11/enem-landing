import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
