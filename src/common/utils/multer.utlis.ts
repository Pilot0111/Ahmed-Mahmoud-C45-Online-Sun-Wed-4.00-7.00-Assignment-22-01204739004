import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import multer from 'multer';
import { tmpdir } from 'os';
import * as fs from 'fs';

export const multer_enum = {
  image: ['image/png', 'image/jpeg', 'image/jpg'],
  pdf: ['application/pdf'],
  video: ['video/mp4'],
};

export enum Store_Enum {
  memory = 'memory',
  disk = 'disk',
}

export const multerOptions = ({
  customTypes = multer_enum.image,
  store_type = Store_Enum.memory,
  fileSize = 5 * 1024 * 1024,
  customPath = 'uploads',
}: {
  customTypes?: string[];
  store_type?: Store_Enum;
  fileSize?: number;
  customPath?: string;
} = {}) => {
  const storage =
    store_type === Store_Enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            // Multer doesn't auto-create directories when using a function for destination, so we do it manually
            if (!fs.existsSync(customPath)) {
              fs.mkdirSync(customPath, { recursive: true });
            }
            cb(null, customPath);
          },
          filename: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + '_' + file.originalname);
          },
        });

  function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
    if (!customTypes.includes(file.mimetype)) {
      // Pass the exception to the callback so NestJS can throw it cleanly
      cb(new BadRequestException('InValid File Type!'), false);
    } else {
      cb(null, true);
    }
  }

  // NestJS expects the options object, NOT the initialized multer() instance
  return { storage, fileFilter, limits: { fileSize } };
};
