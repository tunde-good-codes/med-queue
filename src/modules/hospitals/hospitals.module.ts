import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Hospital } from "./entities/hospital.entity";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService], imports: [
      TypeOrmModule.forFeature([Hospital]),
      JwtModule.register({}),
      PassportModule.register({
        defaultStrategy: 'jwt',
      }),
    ],
})
export class HospitalsModule {}
