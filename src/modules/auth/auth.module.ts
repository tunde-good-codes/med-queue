import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { MailModule } from 'src/infrastructure/mail/mail.module';
import { MailService } from 'src/infrastructure/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategies';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtStrategy],
  imports: [
    TypeOrmModule.forFeature([Auth]),
    MailModule,
    JwtModule.register({}),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
