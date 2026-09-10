import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ServiceEnabledGuard } from './common/guards/service-enabled.guard';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { ExamsModule } from './modules/exams/exams.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TimetableModule } from './modules/timetable/timetable.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SchoolsModule,
    AcademicsModule,
    AttendanceModule,
    HomeworkModule,
    ExamsModule,
    CommunicationModule,
    ComplaintsModule,
    DashboardModule,
    TimetableModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceEnabledGuard,
    },
  ],
})
export class AppModule {}
