import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateContactSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullname!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
