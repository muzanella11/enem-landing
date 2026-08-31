import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  fullname!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;
}
