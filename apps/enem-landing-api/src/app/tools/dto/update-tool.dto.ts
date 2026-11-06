import { PartialType } from '@nestjs/mapped-types';
import { CreateToolDto } from './create-tool.dto.js';

export class UpdateToolDto extends PartialType(CreateToolDto) {}
