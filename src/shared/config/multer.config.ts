
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
   fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Only JPEG, JPG, PNG, or WEBP images are allowed'),
        false,
      );
    }
    callback(null, true);
  },
};