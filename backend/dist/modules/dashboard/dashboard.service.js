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
        const attendancePercentage = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : '0.0';
        return {
            stats: {
                totalStudents,
                totalClasses,
                totalTeachers: totalTeachers ?? 0,
                attendanceTodayPercentage: attendancePercentage,
                attendanceMarkedCount: totalMarked,
                pendingComplaints,
            },
            recentNotices,
            upcomingExams,
        };
    }
    async getParentDashboard(schoolId, userId) {
        const guardians = await this.prisma.guardian.findMany({
            where: {
                user_id: userId,
                school_id: schoolId,
                status: 'ACTIVE',
                deleted_at: null,
            },
            include: {
                student_guardians: {
                    where: { status: 'ACTIVE', deleted_at: null },
                    include: {
                        student: {
                            include: {
                                student_enrollments: {
                                    where: { status: 'ACTIVE', deleted_at: null },
                                    include: {
                                        section: {
                                            include: { class: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const children = [];
        for (const g of guardians) {
            for (const sg of g.student_guardians) {
                if (!children.find((c) => c.studentId === sg.student.id)) {
                    const enr = sg.student.student_enrollments[0];
                    children.push({
                        studentId: sg.student.id,
                        name: `${sg.student.first_name} ${sg.student.last_name || ''}`.trim(),
                        admissionNumber: sg.student.admission_number,
                        rollNumber: enr?.roll_number || null,
                        className: enr?.section?.class?.name || null,
                        sectionName: enr?.section?.name || null,
                        sectionId: enr?.section_id || null,
                    });
                }
            }
        }
        const enrichedChildren = await Promise.all(children.map(async (child) => {
            let attendancePercentage = '100.0';
            let totalDays = 5;
            let presentDays = 5;
            let pendingHomeworkCount = 0;
            const attendance = await this.prisma.attendance.findMany({
                where: {
                    student_id: child.studentId,
                    school_id: schoolId,
                    class_subject_id: null,
                    deleted_at: null,
                },
                orderBy: { date: 'desc' },
                take: 30,
            });
            if (attendance.length > 0) {
                totalDays = attendance.length;
                presentDays = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
                attendancePercentage = ((presentDays / totalDays) * 100).toFixed(1);
            }
            if (child.sectionId) {
                pendingHomeworkCount = await this.prisma.homework.count({
                    where: {
                        section_id: child.sectionId,
                        school_id: schoolId,
                        status: 'PUBLISHED',
                        deleted_at: null,
                    },
                });
            }
            return {
                ...child,
                stats: {
                    attendancePercentage,
                    totalDays,
                    presentDays,
                    pendingHomeworkCount,
                    latestGrade: 'Grade A1 (92%)',
                },
            };
        }));
        const primaryChild = enrichedChildren[0] || null;
        const recentNotices = await this.prisma.notice.findMany({
            where: {
                school_id: schoolId,
                status: 'PUBLISHED',
                target_audience: { in: ['ALL', 'PARENTS', 'STUDENTS'] },
                deleted_at: null,
            },
            orderBy: { published_at: 'desc' },
            take: 5,
        });
        return {
            children: enrichedChildren,
            primaryChild,
            childStats: primaryChild?.stats || {
                attendancePercentage: '100.0',
                totalDays: 5,
                presentDays: 5,
                pendingHomeworkCount: 0,
                latestGrade: 'Grade A1 (92%)',
            },
            recentNotices,
        };
    }
    async getOverview(schoolId, user) {
        const role = user?.role || '';
        if (role === 'GUARDIAN' || role === 'PARENT') {
            const parentData = await this.getParentDashboard(schoolId, user.userId);
            const adminData = await this.getAdminDashboard(schoolId);
            return {
                ...adminData,
                parentData,
            };
        }
        return this.getAdminDashboard(schoolId);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map