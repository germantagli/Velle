import {Controller, Get, Post, Patch, Param, Body, UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import {CardsService} from './cards.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {CurrentUser} from '../common/current-user.decorator';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private cards: CardsService) {}

  @Get()
  async list(@CurrentUser() user: {id: string}) {
    return this.cards.list(user.id);
  }

  @Post()
  async create(@CurrentUser() user: {id: string}) {
    return this.cards.create(user.id);
  }

  @Get(':id')
  async getDetails(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
  ) {
    return this.cards.getDetails(user.id, id);
  }

  @Patch(':id/freeze')
  async toggleFreeze(
    @CurrentUser() user: {id: string},
    @Param('id') id: string,
    @Body() body: {frozen: boolean},
  ) {
    return this.cards.toggleFreeze(user.id, id, body.frozen);
  }
}
