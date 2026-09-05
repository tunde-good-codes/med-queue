// payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Payment } from './entities/payment.entity';
import { Appointment } from '../appointments/entitities/appointment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentService } from "./payments.service";
import { PaymentProcessor } from "./payments.processor";
import { PaystackModule } from "src/infrastructure/paystack/paystackt.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Appointment]),
    PaystackModule,
    BullModule.registerQueue({ name: 'verify-payment' }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentService, PaymentProcessor],
})
export class PaymentsModule {}