
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private compiledLayout: handlebars.TemplateDelegate;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: false,
    });
  }

  async onModuleInit() {
    try {
      const layoutPath = path.join(process.cwd(), 'templates', 'mail', 'layouts', 'main.hbs');
      const layoutRaw = await fs.readFile(layoutPath, 'utf-8');
      this.compiledLayout = handlebars.compile(layoutRaw);
    } catch (err) {
      this.logger.error('Failed initialization compilation of master email layout engine', err.stack);
    }
  }

  private async compileTemplate(templateName: string, context: any): Promise<string> {
    const templatePath = path.join(process.cwd(), 'templates', 'mail', `${templateName}.hbs`);
    const rawTemplate = await fs.readFile(templatePath, 'utf-8');
    const compiledBody = handlebars.compile(rawTemplate)(context);


    return this.compiledLayout({
      body: compiledBody,
      subject: context.subject || 'MedQueue Notification',
    });
  }

  async sendVerificationOtp(email: string, firstName: string, otp: string): Promise<void> {
    const htmlBody = await this.compileTemplate('verify-otp', {
      firstName,
      otp,
      subject: 'Verify Your MedQueue Account',
    });

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM', '"MedQueue" <noreply@medqueue.com>'),
      to: email,
      subject: 'Verify Your MedQueue Account',
      html: htmlBody,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Template-compiled email successfully sent out to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed delivery pipeline execution to ${email}`, error.stack);
      throw new Error('Email engine failed execution loop');
    }
  }
}