import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entitities/appointment.entity';
import { PaystackService } from 'src/infrastructure/paystack/paystack.service';
import {
  AppointmentPaymentStatus,
  AppointmentStatus,
} from '../appointments/appointment.types';
import { PaymentStatus } from './payment.types';
import { randomBytes } from 'crypto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly paystackService: PaystackService,
    @InjectQueue('verify-payment')
    private readonly verifyPaymentQueue: Queue,
  ) {}

  async initializeTransaction(
    patientId: string,
    appointmentId: string,
    email: string,
  ) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment Not Found!');
    }

    if (appointment.patientId !== patientId) {
      throw new ForbiddenException(
        "you're not allow to pay for this appointment",
      );
    }

    if (appointment.paymentStatus === AppointmentPaymentStatus.PAID) {
      throw new ConflictException(
        "you can't initialize payment for a paid appointment",
      );
    }

    const existingPendingPay = await this.paymentRepository.findOne({
      where: {
        appointmentId,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPendingPay) {
      return {
        reference: existingPendingPay.reference,
        message:
          'A payment is already pending for this appointment — reuse the existing reference',
      };
    }

    const reference = `medQueue_${randomBytes(8).toString('hex')}`;
    const amountInKobo = Math.round(appointment.fee * 100);

    const paystackResponse = await this.paystackService.initializeTransaction({
      email,
      amount: amountInKobo,
      reference,
    });

    const payment = this.paymentRepository.create({
      appointmentId,
      patientId,
      reference,
      amount: amountInKobo,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepository.save(payment);

    return {
      authorizationUrl: paystackResponse.authorization_url,
      reference,
    };
  }

  async handleWebhookEvent(event: string, data: { reference: string }) {
    await this.verifyPaymentQueue.add('verify-payment', {
      event,
      reference: data.reference,
    });
  }

  async paymentVerification(reference: string) {
    const payment = await this.paymentRepository.findOne({
      where: {
        reference,
      },
    });

    if (!payment) {
      return;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return;
    }

    const verification =
      await this.paystackService.verifyTransaction(reference);
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: payment.appointmentId,
      },
    });

    if (!appointment) {
      return;
    }

    if (verification.status === 'success') {
      ((payment.status = PaymentStatus.SUCCESS),
        (payment.paidAt = new Date()),
        (appointment.appointmentStatus = AppointmentStatus.CONFIRMED),
        (appointment.paymentStatus = AppointmentPaymentStatus.PAID));
    } else {
      ((payment.status = PaymentStatus.FAILED),
        (appointment.appointmentStatus = AppointmentStatus.CANCELLED));
    }

    await this.paymentRepository.save(payment);
    await this.appointmentRepository.save(appointment);
  }

  async findPaymentHistory(patientId: string, query: PaginationQueryDto) {
    const { limit = 5, page = 1 } = query;

    const skip = Math.floor(page - 1) ** limit;
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: {
        patientId,
      },
      skip,
      take: limit,
      order: {
        paidAt: 'DESC',
      },
    });

    return {
      payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }


    async findOne(id: string, requesterId: string, requesterRole: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (requesterRole !== 'admin' && payment.patientId !== requesterId) {
      throw new ForbiddenException('You do not have access to this payment');
    }
    return payment;
  }
}
