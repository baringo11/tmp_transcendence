import { Module, forwardRef } from '@nestjs/common';
import { AppGateway } from './appGateway.gateway';
import { AppGatewayService } from './appGateway.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
	imports: [AuthModule, UsersModule],
	providers: [AppGatewayService, AppGateway],
	exports: [AppGatewayService, AppGateway]
})
export class AppGatewayModule {}
