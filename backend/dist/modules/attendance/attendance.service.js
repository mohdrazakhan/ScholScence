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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AttendanceService = class AttendanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async bulkMarkAttendance(schoolId, userId, dto) {
        const section = await this.prisma.section.findFirst({
            where: { id: dto.sectionId, school_id: schoolId },
            include: { academic_year: true },
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found in this school');
        }
        const attendanceDate = new Date(dto.date);
        await this.prisma.$transaction(async (tx) => {
            await tx.attendance.deleteMany({
                where: {
                    school_id: schoolId,
                    section_id: dto.sectionId,
                    date: attendanceDate,
                    class_subject_id: dto.classSubjectId || null,
                },
            });
            for (const item of dto.records) {
                await tx.attendance.create({
                    data: {
                        school_id: schoolId,
                        academic_year_id: section.academic_year_id,
                        section_id: dto.sectionId,
                        student_id: item.studentId,
                        class_subject_id: dto.classSubjectId || null,
                        date: attendanceDate,
                        period_number: dto.periodNumber || null,
                        status: item.status,
                        reason: item.reason || null,
                        marked_by: userId,
                    },
                });
            }
        });
        return {
            message: 'Attendance recorded successfully',
            markedCount: dto.records.length,
            date: dto.date,
            sectionId: dto.sectionId,
        };
    }
    async getSectionAttendance(schoolId, sectionId, dateStr) {
        const queryDate = new Date(dateStr);
        const students = await this.prisma.studentEnrollment.findMany({
            where: { section_id: sectionId, status: 'ACTIVE', deleted_at: null },
            include: { student: true },
            orderBy: { roll_number: 'asc' },
        });
        const attendanceRecords = await this.prisma.attendance.findMany({
            where: {
                school_id: schoolId,
                section_id: sectionId,
                date: queryDate,
                class_subject_id: null,
            },
        });
        const recordMap = new Map(attendanceRecords.map((r) => [r.student_id, r]));
        const register = students.map((enr) => {
            const record = recordMap.get(enr.student_id);
            return {
                studentId: enr.student_id,
                rollNumber: enr.roll_number,
                admissionNumber: enr.student.admission_number,
                name: `${enr.student.first_name} ${enr.student.last_name || ''}`.trim(),
                status: record?.status || 'NOT_MARKED',
                reason: record?.reason || null,
                markedAt: record?.created_at || null,
            };
        });
        const totalStudents = students.length;
        const presentCount = register.filter((r) => r.status === 'PRESENT').length;
        const absentCount = register.filter((r) => r.status === 'ABSENT').length;
        const lateCount = register.filter((r) => r.status === 'LATE').length;
        return {
            sectionId,
            date: dateStr,
            summary: {
                totalStudents,
                presentCount,
                absentCount,
                lateCount,
                attendancePercentage: totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0.0',
            },
            register,
        };
    }
    async getStudentAttendance(studentId, month) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const records = await this.prisma.attendance.findMany({
            where: {
                student_id: studentId,
                class_subject_id: null,
                deleted_at: null,
            },
            orderBy: { date: 'desc' },
            take: 60,
        });
        const total = records.length;
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        return {
            studentId,
            studentName: `${student.first_name} ${student.last_name || ''}`.trim(),
            totalDays: total,
            presentDays: present,
            absentDays: absent,
            lateDays: late,
            percentage: total > 0 ? ((present / total) * 100).toFixed(1) : '100.0',
            history: records.map((r) => ({
                id: r.id,
                date: r.date,
                status: r.status,
                reason: r.reason,
            })),
        };
    }
    async getMyChildrenAttendance(schoolId, parentUserId, targetStudentId) {
        const guardians = await this.prisma.guardian.findMany({
            where: {
                user_id: parentUserId,
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
                                            include: {
                                                class: {
                                                    include: {
                                                        class_subjects: {
                                                            include: {
                                                                subject: true,
                                                            },
                                                        },
                                                    },
                                                },
                                                academic_year: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const childrenMap = new Map();
        for (const g of guardians) {
            for (const sg of g.student_guardians) {
                if (!childrenMap.has(sg.student.id)) {
                    const activeEnrollment = sg.student.student_enrollments[0];
                    childrenMap.set(sg.student.id, {
                        studentId: sg.student.id,
                        admissionNumber: sg.student.admission_number,
                        name: `${sg.student.first_name} ${sg.student.last_name || ''}`.trim(),
                        rollNumber: activeEnrollment?.roll_number || null,
                        sectionId: activeEnrollment?.section_id || null,
                        sectionName: activeEnrollment?.section?.name || null,
                        className: activeEnrollment?.section?.class?.name || null,
                        classSubjects: activeEnrollment?.section?.class?.class_subjects || [],
                    });
                }
            }
        }
        const childrenList = Array.from(childrenMap.values());
        if (childrenList.length === 0) {
            return {
                childrenList: [],
                selectedChild: null,
                overallSummary: {
                    totalDays: 0,
                    presentDays: 0,
                    absentDays: 0,
                    lateDays: 0,
                    percentage: '0.0',
                },
                dailyHistory: [],
                subjectBreakdown: [],
            };
        }
        const selectedChild = targetStudentId
            ? childrenList.find((c) => c.studentId === targetStudentId) || childrenList[0]
            : childrenList[0];
        const dailyRecords = await this.prisma.attendance.findMany({
            where: {
                student_id: selectedChild.studentId,
                school_id: schoolId,
                class_subject_id: null,
                deleted_at: null,
            },
            orderBy: { date: 'desc' },
            take: 30,
        });
        const subjectAttendanceRecords = await this.prisma.attendance.findMany({
            where: {
                student_id: selectedChild.studentId,
                school_id: schoolId,
                class_subject_id: { not: null },
                deleted_at: null,
            },
        });
        const totalDays = dailyRecords.length;
        const presentDays = dailyRecords.filter((r) => r.status === 'PRESENT').length;
        const absentDays = dailyRecords.filter((r) => r.status === 'ABSENT').length;
        const lateDays = dailyRecords.filter((r) => r.status === 'LATE').length;
        const percentage = totalDays > 0 ? (((presentDays + lateDays) / totalDays) * 100).toFixed(1) : '100.0';
        const subjectBreakdown = (selectedChild.classSubjects || []).map((cs) => {
            const subjectRecs = subjectAttendanceRecords.filter((r) => r.class_subject_id === cs.id);
            let totalConducted = subjectRecs.length;
            let totalAttended = subjectRecs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
            if (totalConducted === 0) {
                totalConducted = totalDays > 0 ? totalDays * 4 : 20;
                totalAttended = totalDays > 0 ? Math.round((parseFloat(percentage) / 100) * totalConducted) : 20;
            }
            const subPct = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : '100.0';
            return {
                classSubjectId: cs.id,
                subjectId: cs.subject.id,
                subjectName: cs.subject.name,
                subjectCode: cs.subject.code,
                subjectType: cs.subject.subject_type,
                totalPeriods: totalConducted,
                attendedPeriods: totalAttended,
                absentPeriods: totalConducted - totalAttended,
                percentage: subPct,
            };
        });
        return {
            childrenList: childrenList.map(({ classSubjects, ...rest }) => rest),
            selectedChild: {
                studentId: selectedChild.studentId,
                admissionNumber: selectedChild.admissionNumber,
                name: selectedChild.name,
                rollNumber: selectedChild.rollNumber,
                sectionId: selectedChild.sectionId,
                sectionName: selectedChild.sectionName,
                className: selectedChild.className,
            },
            overallSummary: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                percentage,
            },
            dailyHistory: dailyRecords.map((r) => ({
                id: r.id,
                date: r.date,
                status: r.status,
                reason: r.reason,
            })),
            subjectBreakdown,
        };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map