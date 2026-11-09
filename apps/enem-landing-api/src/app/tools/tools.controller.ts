import { successResponse } from '@enem-landing/backend-utils';
import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  Post,
  Put,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { CreateDonationOptionDto } from './dto/create-donation-option.dto.js';
import { CreateToolDto } from './dto/create-tool.dto.js';
import { ReorderToolsDto } from './dto/reorder-tools.dto.js';
import { UpdateDonationOptionDto } from './dto/update-donation-option.dto.js';
import { UpdateToolDto } from './dto/update-tool.dto.js';
import { UpdateToolsSettingsDto } from './dto/update-tools-settings.dto.js';
import { GoldPriceService } from './gold-price.service.js';
import { ToolsService } from './tools.service.js';

const admin = (req: Request) =>
  assertAdminRole((req as Request & { user: User }).user);

@Controller('tools')
export class ToolsController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly goldPriceService: GoldPriceService,
  ) {}

  /** Public - daily spot gold history for tools.muzanella.com (Story 38). */
  @Get('gold-price/history')
  async goldPriceHistory(
    @Query('days', new DefaultValuePipe(365), ParseIntPipe) days: number,
  ) {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.goldPriceService.history(Math.min(Math.max(days, 1), 1830)),
    );
  }

  /** Public - consumed by enem-landing-tools' BFF (cached). */
  @Get('config')
  async getConfig() {
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.getPublicConfig(),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/tools')
  async findAllTools(@Req() req: Request) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.findAllTools(),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post('admin/tools')
  async createTool(@Req() req: Request, @Body() dto: CreateToolDto) {
    admin(req);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.toolsService.createTool(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/tools/reorder')
  async reorderTools(@Req() req: Request, @Body() dto: ReorderToolsDto) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.reorderTools(dto.ids),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/tools/:id')
  async updateTool(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateToolDto,
  ) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.updateTool(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete('admin/tools/:id')
  async removeTool(@Req() req: Request, @Param('id') id: string) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.removeTool(id),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/donation-options')
  async findAllDonationOptions(@Req() req: Request) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.findAllDonationOptions(),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post('admin/donation-options')
  async createDonationOption(
    @Req() req: Request,
    @Body() dto: CreateDonationOptionDto,
  ) {
    admin(req);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.toolsService.createDonationOption(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/donation-options/:id')
  async updateDonationOption(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateDonationOptionDto,
  ) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.updateDonationOption(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete('admin/donation-options/:id')
  async removeDonationOption(@Req() req: Request, @Param('id') id: string) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.removeDonationOption(id),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/settings')
  async getSettings(@Req() req: Request) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.getSettings(),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/settings')
  async updateSettings(
    @Req() req: Request,
    @Body() dto: UpdateToolsSettingsDto,
  ) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.updateSettings(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/stats')
  async getStats(@Req() req: Request) {
    admin(req);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.toolsService.getStats(),
    );
  }
}
