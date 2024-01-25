import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class FileUploadService {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    async uploadFile(id: number, file: Express.Multer.File) {
        if (!file) {
            return false;
        }
        return this.usersService.update(id, {profileImg: file.path});
    }

    async deleteFile( id: number, imageName: string) {
        const imagePath = `uploads/${imageName}`;

        if (fs.existsSync(imagePath))
            fs.unlinkSync(imagePath);
    }
}