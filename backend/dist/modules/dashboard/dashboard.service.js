"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdminDashboard(schoolId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalStudents, totalClasses, totalTeachers, todayAttendance, pendingComplaints, recentNotices, upcomingExams,] = await Promise.all([
            this.prisma.student.count({
                where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
            }),
            this.prisma.class.count({
                where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
            }),
            this.prisma.userSchoolRole.count({
                where: {
                    school_id: schoolId,
                    role: { code: 'TEACHER' },
                    status: 'ACTIVE',
                    deleted_at: null,
                },
            }),
            this.prisma.attendance.findMany({
                where: {
                    school_id: schoolId,
                    date: today,
                    class_subject_id: null,
                },
            }),
            this.prisma.complaint.count({
                where: {
                    school_id: schoolId,
                    status: { in: ['OPEN', 'IN_PROGRESS'] },
                    deleted_at: null,
                },
            }),
            this.prisma.notice.findMany({
                where: { school_id: schoolId, status: 'PUBLISHED', deleted_at: null },
                orderBy: { published_at: 'desc' },
                take: 5,
                include: {
                    publisher: {
                        select: {
                            first_name: true,
                            last_name: true,
                        },
                    },
                },
            }),
            this.prisma.exam.findMany({
                where: { school_id: schoolId, status: 'SCHEDULED', deleted_at: null },
                orderBy: { start_date: 'asc' },
                take: 3,
            }),
        ]);
        const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;
        const totalMarked = todayAttendance.length;
        const attendancePercentage = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : '95.0';
        return {
            stats: {
                totalStudents,
                totalClasses,
                totalTeachers: totalTeachers || 1,
                attendanceTodayPercentage: attendancePercentage,
                attendanceMarkedCount: totalMarked,
                pendingComplaints,
            },
            recentNotices,
            upcomingExams,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map