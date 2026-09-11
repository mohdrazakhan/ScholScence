import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('SchoolSenseAPI');
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // CORS — restrict to known frontend origins in production
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: isProd ? allowedOrigins : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors and filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger — only available in non-production environments
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('SchoolSense Enterprise Campus OS - REST API')
      .setDescription(`
## SchoolSense Multi-Tenant Campus Management System

### 🔐 Authentication & Security
- **Bearer Authentication**: Pass JWT token in \`Authorization: Bearer <token>\` header for protected endpoints.
- **Tenant Context**: Automatic multi-tenant isolation based on authenticated user's active school.

### 👥 Supported Roles & Access Scopes:
- **SUPER_ADMIN**: Global system administrator across all school tenants.
- **SCHOOL_ADMIN / PRINCIPAL**: Institutional executive access with cross-class visibility and schedule authority.
- **CLASS_TEACHER**: Designated section manager with homeroom attendance, class timetable, and grievance delegation rights.
- **TEACHER**: Teaching faculty with subject mark entry, homework publishing, and individual teaching routines.
- **PARENT / GUARDIAN**: Dynamic child attendance diary, subject performance breakdowns, weekly timetables, and grievance desk.
- **STUDENT**: Homework diary, academic report cards, and timetable schedule.
      `)
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT token obtained from `/api/v1/auth/login`',
          in: 'header',
        },
        'bearer',
      )
      .addTag('Authentication', 'Login, token issuance, session verification, and user profile retrieval')
      .addTag('Dashboard', 'Role-scoped institutional metrics, teacher workloads, and parent student KPIs')
      .addTag('Schools', 'Multi-tenant school profiles, campus branches, and active academic sessions')
      .addTag('Academics', 'Classes, sections, curriculum subjects, student enrollment rosters, and teacher allocations')
      .addTag('Timetable', 'Weekly matrix schedules, teacher routines, child timetables, and recess/lunch intervals')
      .addTag('Attendance', 'Section daily registers, bulk marking, live parent child diary, and subject-wise breakdown')
      .addTag('Homework', 'Assignment creation, submission deadlines, subject diaries, and parent feeds')
      .addTag('Exams & Marks', 'Examinations schedules, subject papers, marksheets entry, and student academic report cards')
      .addTag('Complaints / Grievances', 'Multi-tiered grievance ticketing, role-scoped inboxes, delegation, and live conversation threads')
      .addTag('Communication', 'Circular broadcasts, school notices, and academic events calendar')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'SchoolSense API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 OpenAPI Documentation: http://localhost:${process.env.PORT || 3000}/api/docs`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 SchoolSense Backend running on port ${port} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
}

bootstrap();
