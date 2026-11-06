import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { CreateDonationOptionDto } from './dto/create-donation-option.dto.js';
import { CreateToolDto } from './dto/create-tool.dto.js';
import { ReorderToolsDto } from './dto/reorder-tools.dto.js';
import { UpdateDonationOptionDto } from './dto/update-donation-option.dto.js';
import { UpdateToolDto } from './dto/update-tool.dto.js';
import { UpdateToolsSettingsDto } from './dto/update-tools-settings.dto.js';
import { ToolsService } from './tools.service.js';

const admin = (req: Request) =>
  assertAdminRole((req as Request & { user: User }).user);

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  /** Public - consumed by enem-landing-tools' BFF (cached). */
  @Get('config')
  getConfig() {
    return this.toolsService.getPublicConfig();
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/tools')
  findAllTools(@Req() req: Request) {
    admin(req);
    return this.toolsService.findAllTools();
  }

  @UseGuards(SsoAuthGuard)
  @Post('admin/tools')
  createTool(@Req() req: Request, @Body() dto: CreateToolDto) {
    admin(req);
    return this.toolsService.createTool(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/tools/reorder')
  reorderTools(@Req() req: Request, @Body() dto: ReorderToolsDto) {
    admin(req);
    return this.toolsService.reorderTools(dto.ids);
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/tools/:id')
  updateTool(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateToolDto,
  ) {
    admin(req);
    return this.toolsService.updateTool(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete('admin/tools/:id')
  removeTool(@Req() req: Request, @Param('id') id: string) {
    admin(req);
    return this.toolsService.removeTool(id);
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/donation-options')
  findAllDonationOptions(@Req() req: Request) {
    admin(req);
    return this.toolsService.findAllDonationOptions();
  }

  @UseGuards(SsoAuthGuard)
  @Post('admin/donation-options')
  createDonationOption(
    @Req() req: Request,
    @Body() dto: CreateDonationOptionDto,
  ) {
    admin(req);
    return this.toolsService.createDonationOption(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/donation-options/:id')
  updateDonationOption(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateDonationOptionDto,
  ) {
    admin(req);
    return this.toolsService.updateDonationOption(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete('admin/donation-options/:id')
  removeDonationOption(@Req() req: Request, @Param('id') id: string) {
    admin(req);
    return this.toolsService.removeDonationOption(id);
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/settings')
  getSettings(@Req() req: Request) {
    admin(req);
    return this.toolsService.getSettings();
  }

  @UseGuards(SsoAuthGuard)
  @Put('admin/settings')
  updateSettings(@Req() req: Request, @Body() dto: UpdateToolsSettingsDto) {
    admin(req);
    return this.toolsService.updateSettings(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Get('admin/stats')
  getStats(@Req() req: Request) {
    admin(req);
    return this.toolsService.getStats();
  }
}
