import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Server-to-server payload from enem-landing-monitor-api (InternalApiGuard).
 * There is deliberately no recipient field: monitor alerts always go to
 * ADMIN_NOTIFICATION_EMAIL from CMS Settings.
 */
export class SendMonitorAlertEmailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsIn(['critical', 'warning', 'info'])
  severity!: 'critical' | 'warning' | 'info';

  @IsIn(['firing', 'resolved'])
  kind!: 'firing' | 'resolved';

  @IsString()
  @MaxLength(20)
  environment!: string;

  @IsISO8601()
  time!: string;

  @IsString()
  @MaxLength(2000)
  summary!: string;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  details!: string[];

  /** Link to the related monitor page; only http(s) so no `javascript:` lands in the button. */
  @IsString()
  @MaxLength(500)
  @Matches(/^https?:\/\/[^\s"'<>]+$/)
  url!: string;
}
