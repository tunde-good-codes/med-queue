import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QueueModule } from './modules/queue/queue.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SearchModule } from './modules/search/search.module';
import { RatingsModule } from './modules/ratings/ratings.module';

@Module({
  imports: [AuthModule, HospitalsModule, DoctorsModule, AppointmentsModule, QueueModule, PrescriptionsModule, PaymentsModule, DocumentsModule, AnalyticsModule, SearchModule, RatingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
