import { Controller, UseInterceptors, UploadedFile, Res, UseGuards, Post, Param, ParseIntPipe, Delete, Body } from '@nestjs/common';
import { JwtAuthGuard ,  UserGuard } from '../auth/guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Express } from 'express';
import { FileUploadService } from './file-upload.service';

@Controller('upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @UseGuards(JwtAuthGuard, UserGuard)
  @Post(':id')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
      return this.fileUploadService.uploadFile(id, file);
  }

  @UseGuards(JwtAuthGuard, UserGuard)
  @Delete(':id')
  @UseInterceptors(FileInterceptor('file'))
  deleteFile(@Param('id', ParseIntPipe) id: number, @Body('imageName') imageName: string) {
      return this.fileUploadService.deleteFile(id, imageName);
  }
}