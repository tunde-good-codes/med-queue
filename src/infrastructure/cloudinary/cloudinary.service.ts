import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';
import * as streamifier from 'streamifier';

export interface UploadImage {
  publicId: string;
  url: string;
}

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY)
    private readonly cloud: typeof cloudinary,
  ) {}

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadImage> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloud.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject('Image Upload Failed');
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    });
  }


  async deleteImage(publicId:string){
    return await this.cloud.uploader.destroy(publicId)
  }
}
