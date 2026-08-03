import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Hospital } from "./entities/hospital.entity";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { CloudinaryModule } from "src/infrastructure/cloudinary/cloudinary.module";
import { Department } from "./entities/department.entity";

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService], imports: [
      TypeOrmModule.forFeature([Hospital, Department]),
      JwtModule.register({}),
      PassportModule.register({
        defaultStrategy: 'jwt',
      }),CloudinaryModule
    ],
})
export class HospitalsModule {}
