import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { PaystackService } from 'src/infrastructure/paystack/paystack.service';
import { JwtAuthGuard } from 'src/shared/guards/JwtAuthGuard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserRole } from 'src/modules/auth/entities/auth.entity';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { PaymentService } from './payments.service';
import { ApiGetService } from 'src/shared/decorators/swagger-docs.decorators';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('initialize/:appointmentId')
  @ApiGetService('initialize a new payment for appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  async initialize(
    @Req() req: any,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.paymentsService.initializeTransaction(
      req.user.id,
      appointmentId,
      req.user.email,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: Request,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody;

    if (!signature || !rawBody) {
      throw new BadRequestException('Missing signature or body');
    }

    const isValid = this.paystackService.verifyWebhookCredentials(
      rawBody,
      signature,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      await this.paymentsService.handleWebhookEvent(event, data);
    }

    return { received: true };
  }

  @Get('history')
    @ApiGetService('get a  payment history for appointment')

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  async history(@Req() req: any, @Query() query: PaginationQueryDto) {
    return this.paymentsService.findPaymentHistory(req.user.id, query);
  }

  @Get(':id')
  @ApiGetService('get a  payment with id for appointment')
  @UseGuards(JwtAuthGuard)
  async findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id, req.user.id);
  }
}
