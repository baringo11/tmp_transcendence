import { Module } from '@nestjs/common';
import { IntraAuthService } from './intra-auth.service';

@Module({
  imports: [],
  providers: [IntraAuthService],
  exports: [IntraAuthService]
})
export class IntraAuthModule {}
