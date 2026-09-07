import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueRepo } from './entities/queue';
import { Schedule } from '../doctors/schedule.entity'; // confirm actual path
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { QueueController } from './queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QueueRepo, Schedule])],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService],
})
export class QueueModule {}