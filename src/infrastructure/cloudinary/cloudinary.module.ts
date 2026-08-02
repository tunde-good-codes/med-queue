import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

@Module({
  exports: [CloudinaryService],
  providers: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
