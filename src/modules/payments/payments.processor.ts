import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PaymentService } from './payments.service';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('verify-payment')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger('payment-processor');
  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(
    job: Job<{ event: string; reference: string }>,
  ): Promise<void> {
    this.logger.log(`processing payment verification for reference: ${job.data.reference}`)

    await this.paymentService.paymentVerification(job.data.reference)
  }
}
