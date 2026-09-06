import { IsEmail, IsOptional } from 'class-validator';

/** `to` is optional - defaults to the first configured ADMIN_NOTIFICATION_EMAIL if omitted. */
export class SendTestEmailDto {
  @IsEmail()
  @IsOptional()
  to?: string;
}
