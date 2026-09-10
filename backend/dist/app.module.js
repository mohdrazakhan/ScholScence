"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const schools_module_1 = require("./modules/schools/schools.module");
const academics_module_1 = require("./modules/academics/academics.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const homework_module_1 = require("./modules/homework/homework.module");
const exams_module_1 = require("./modules/exams/exams.module");
const communication_module_1 = require("./modules/communication/communication.module");
const complaints_module_1 = require("./modules/complaints/complaints.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const timetable_module_1 = require("./modules/timetable/timetable.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            schools_module_1.SchoolsModule,
            academics_module_1.AcademicsModule,
            attendance_module_1.AttendanceModule,
            homework_module_1.HomeworkModule,
            exams_module_1.ExamsModule,
            communication_module_1.CommunicationModule,
            complaints_module_1.ComplaintsModule,
            dashboard_module_1.DashboardModule,
            timetable_module_1.TimetableModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map