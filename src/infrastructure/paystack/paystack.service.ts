import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface InitializeTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

@Injectable()
export class PaystackService {
  private readonly client: AxiosInstance;
  private readonly secret: string;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    this.client = axios.create({
      baseURL: configService.getOrThrow<string>('PAYSTACK_BASE_URL'),
      headers: {
        Authorization: `Bearer ${this.secret}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async initializeTransaction(params: {
    email: string;
    amount: number;
    reference: string;
    callbackUrl?: string;
  }): Promise<InitializeTransactionResponse> {
    try {
      const response = await this.client.post(`/transaction/initialize`, {
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callbackUrl: params.callbackUrl,
      });

      return response.data.data;
    } catch (error) {
      throw new BadRequestException(`Failed to initialize transaction`);
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await this.client.get(
        `/transaction/verify/${reference}`,
      );
      return response.data.data;
    } catch (error) {
      throw new BadRequestException('Failed to verify transaction');
    }
  }

  verifyWebhookCredentials(rawBody: Buffer, signatureHeader: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secret)
      .update(rawBody)
      .digest('hex');
    return hash === signatureHeader;
  }
}
