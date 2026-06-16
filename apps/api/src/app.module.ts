import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SimpleAuthGuard } from './auth/simple-auth.guard';
import { TokenService } from './auth/token.service';
import { AppController } from './controllers/app.controller';
import { AuthController } from './controllers/auth.controller';
import { CompanyController } from './controllers/company.controller';
import { MobileController } from './controllers/mobile.controller';
import { SiteController } from './controllers/site.controller';
import { PrismaService } from './prisma.service';
import { SeedService } from './seed.service';
import { ReportingService } from './services/reporting.service';

@Module({
  controllers: [AppController, AuthController, SiteController, CompanyController, MobileController],
  providers: [
    PrismaService,
    SeedService,
    ReportingService,
    TokenService,
    {
      provide: APP_GUARD,
      useClass: SimpleAuthGuard,
    },
  ],
})
export class AppModule {}
