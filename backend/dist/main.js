"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('SchoolSenseAPI');
    const isProd = process.env.NODE_ENV === 'production';
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
        .split(',')
        .map((o) => o.trim());
    app.enableCors({
        origin: isProd ? allowedOrigins : '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    if (!isProd) {
        const config = new swagger_1.DocumentBuilder()
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
            .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter your JWT token obtained from `/api/v1/auth/login`',
            in: 'header',
        }, 'bearer')
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
//# sourceMappingURL=main.js.map