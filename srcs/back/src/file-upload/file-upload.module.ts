// src/file-upload/file-upload.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadController } from './file-upload.controller';
import { UsersModule } from '../users/users.module';
import { FileUploadService } from './file-upload.service'

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // O el directorio que desees utilizar
        filename: (req, file, callback) => {
          // Generar un nombre de archivo único
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          // Llamar al callback con el nuevo nombre
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
    UsersModule,
  ],
  providers: [FileUploadService],
  controllers: [FileUploadController],
  exports: [MulterModule],
})
export class FileUploadModule {}