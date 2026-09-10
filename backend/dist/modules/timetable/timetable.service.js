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
exports.TimetableService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const DAY_MAP = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
};
const REVERSE_DAY_MAP = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
};
let TimetableService = class TimetableService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkEditPermission(schoolId, sectionId, user) {
        const role = user.role || '';
        const isSuperAdmin = role === 'SUPER_ADMIN';
        const isPrincipal = role === 'PRINCIPAL';
        const isSchoolAdmin = role === 'SCHOOL_ADMIN' || role === 'ADMIN';
        if (isSuperAdmin || isPrincipal || isSchoolAdmin) {
            return true;
        }
        const assignment = await this.prisma.sectionTeacherAssignment.findFirst({
            where: {
                school_id: schoolId,
                section_id: sectionId,
                user_id: user.userId,
                deleted_at: null,
            },
        });
        if (!assignment) {
            throw new common_1.ForbiddenException('Access denied: Only Principals, School Admins, and the assigned Class Teacher can modify this timetable.');
        }
        return true;
    }
    async getSectionTimetable(schoolId, sectionId) {
        const section = await this.prisma.section.findFirst({
            where: { id: sectionId, school_id: schoolId },
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
        });
        if (!section) {
            throw new common_1.NotFoundException('Class Section not found');
        }
        const periods = await this.prisma.timetablePeriod.findMany({
            where: {
                school_id: schoolId,
                section_id: sectionId,
                deleted_at: null,
            },
            include: {
                class_subject: {
                    include: {
                        subject: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { day_of_week: 'asc' },
                { period_number: 'asc' },
                { start_time: 'asc' },
            ],
        });
        return {
            section: {
                id: section.id,
                name: section.name,
                code: section.code,
                classId: section.class.id,
                className: section.class.name,
                academicYearId: section.academic_year_id,
                academicYearName: section.academic_year.name,
            },
            availableSubjects: (section.class.class_subjects || []).map((cs) => ({
                classSubjectId: cs.id,
                subjectId: cs.subject.id,
                name: cs.subject.name,
                code: cs.subject.code,
                subjectType: cs.subject.subject_type,
            })),
            periods: periods.map((p) => ({
                id: p.id,
                dayOfWeek: REVERSE_DAY_MAP[p.day_of_week] || 1,
                dayName: p.day_of_week,
                periodNumber: p.period_number,
                startTime: p.start_time,
                endTime: p.end_time,
                slotType: p.slot_type,
                title: p.title || (p.class_subject?.subject?.name ?? 'Period'),
                subjectName: p.class_subject?.subject?.name || null,
                subjectCode: p.class_subject?.subject?.code || null,
                classSubjectId: p.class_subject_id,
                teacherId: p.teacher_id,
                teacherName: p.teacher ? `${p.teacher.first_name} ${p.teacher.last_name || ''}`.trim() : null,
                roomNumber: p.room_number,
            })),
        };
    }
    async getTeacherTimetable(schoolId, teacherId) {
        const periods = await this.prisma.timetablePeriod.findMany({
            where: {
                school_id: schoolId,
                teacher_id: teacherId,
                deleted_at: null,
            },
            include: {
                section: {
                    include: {
                        class: true,
                    },
                },
                class_subject: {
                    include: {
                        subject: true,
                    },
                },
            },
            orderBy: [
                { day_of_week: 'asc' },
                { start_time: 'asc' },
            ],
        });
        return {
            teacherId,
            periods: periods.map((p) => ({
                id: p.id,
                dayOfWeek: REVERSE_DAY_MAP[p.day_of_week] || 1,
                dayName: p.day_of_week,
                periodNumber: p.period_number,
                startTime: p.start_time,
                endTime: p.end_time,
                slotType: p.slot_type,
                title: p.title || p.class_subject?.subject?.name,
                subjectName: p.class_subject?.subject?.name || null,
                subjectCode: p.class_subject?.subject?.code || null,
                className: p.section.class.name,
                sectionName: p.section.name,
                sectionId: p.section_id,
                roomNumber: p.room_number,
            })),
        };
    }
    async getMyChildTimetable(schoolId, parentUserId, targetStudentId) {
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
                                                class: true,
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
                        academicYear: activeEnrollment?.section?.academic_year?.name || null,
                    });
                }
            }
        }
        const childrenList = Array.from(childrenMap.values());
        if (childrenList.length === 0) {
            return {
                childrenList: [],
                selectedChild: null,
                timetable: null,
            };
        }
        const selectedChild = targetStudentId
            ? childrenList.find((c) => c.studentId === targetStudentId) || childrenList[0]
            : childrenList[0];
        if (!selectedChild || !selectedChild.sectionId) {
            return {
                childrenList,
                selectedChild,
                timetable: null,
            };
        }
        const timetableData = await this.getSectionTimetable(schoolId, selectedChild.sectionId);
        return {
            childrenList,
            selectedChild,
            timetable: timetableData,
        };
    }
    async savePeriod(schoolId, user, dto) {
        await this.checkEditPermission(schoolId, dto.sectionId, user);
        const section = await this.prisma.section.findFirst({
            where: { id: dto.sectionId, school_id: schoolId },
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found');
        }
        const dayName = DAY_MAP[dto.dayOfWeek] || 'MONDAY';
        const period = await this.prisma.timetablePeriod.create({
            data: {
                school_id: schoolId,
                academic_year_id: section.academic_year_id,
                section_id: dto.sectionId,
                class_subject_id: dto.classSubjectId || null,
                teacher_id: dto.teacherId || null,
                day_of_week: dayName,
                period_number: dto.periodNumber,
                start_time: dto.startTime,
                end_time: dto.endTime,
                slot_type: dto.slotType,
                title: dto.title || null,
                room_number: dto.roomNumber || null,
            },
        });
        return period;
    }
    async bulkSaveSectionTimetable(schoolId, sectionId, user, dto) {
        await this.checkEditPermission(schoolId, sectionId, user);
        const section = await this.prisma.section.findFirst({
            where: { id: sectionId, school_id: schoolId },
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.timetablePeriod.deleteMany({
                where: {
                    school_id: schoolId,
                    section_id: sectionId,
                },
            });
            for (const p of dto.periods) {
                const dayName = DAY_MAP[p.dayOfWeek] || 'MONDAY';
                await tx.timetablePeriod.create({
                    data: {
                        school_id: schoolId,
                        academic_year_id: section.academic_year_id,
                        section_id: sectionId,
                        class_subject_id: p.classSubjectId || null,
                        teacher_id: p.teacherId || null,
                        day_of_week: dayName,
                        period_number: p.periodNumber,
                        start_time: p.startTime,
                        end_time: p.endTime,
                        slot_type: p.slotType,
                        title: p.title || null,
                        room_number: p.roomNumber || null,
                    },
                });
            }
        });
        return this.getSectionTimetable(schoolId, sectionId);
    }
    async deletePeriod(schoolId, periodId, user) {
        const period = await this.prisma.timetablePeriod.findFirst({
            where: { id: periodId, school_id: schoolId },
        });
        if (!period) {
            throw new common_1.NotFoundException('Timetable period not found');
        }
        await this.checkEditPermission(schoolId, period.section_id, user);
        await this.prisma.timetablePeriod.delete({
            where: { id: periodId },
        });
        return { message: 'Period removed successfully', id: periodId };
    }
};
exports.TimetableService = TimetableService;
exports.TimetableService = TimetableService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TimetableService);
//# sourceMappingURL=timetable.service.js.map