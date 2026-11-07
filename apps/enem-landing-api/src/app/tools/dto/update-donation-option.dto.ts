import { PartialType } from '@nestjs/mapped-types';
import { CreateDonationOptionDto } from './create-donation-option.dto.js';

export class UpdateDonationOptionDto extends PartialType(
  CreateDonationOptionDto,
) {}
