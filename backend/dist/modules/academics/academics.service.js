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
exports.AcademicsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AcademicsService = class AcademicsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getClasses(schoolId) {
        return this.prisma.class.findMany({
            where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
            orderBy: { display_order: 'asc' },
            include: {
                sections: {
                    where: { status: 'ACTIVE', deleted_at: null },
                    orderBy: { display_order: 'asc' },
                },
            },
        });
    }
    async getSections(schoolId, classId) {
        return this.prisma.section.findMany({
            where: {
                school_id: schoolId,
                ...(classId ? { class_id: classId } : {}),
                status: 'ACTIVE',
                deleted_at: null,
            },
            orderBy: [{ class: { display_order: 'asc' } }, { display_order: 'asc' }],
            include: {
                class: true,
                academic_year: true,
                _count: {
                    select: { student_enrollments: true },
                },
            },
        });
    }
    async getSubjects(schoolId) {
        return this.prisma.subject.findMany({
            where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
            orderBy: { display_order: 'asc' },
        });
    }
    async getClassSubjects(classId, academicYearId) {
        return this.prisma.classSubject.findMany({
            where: {
                class_id: classId,
                ...(academicYearId ? { academic_year_id: academicYearId } : {}),
                status: 'ACTIVE',
                deleted_at: null,
            },
            include: {
                subject: true,
                class: true,
            },
            orderBy: { display_order: 'asc' },
        });
    }
    async getStudentsBySection(sectionId) {
        const enrollments = await this.prisma.studentEnrollment.findMany({
            where: {
                section_id: sectionId,
                status: 'ACTIVE',
                deleted_at: null,
            },
            include: {
                student: {
                    include: {
                        student_guardians: {
                            where: { status: 'ACTIVE', deleted_at: null },
                            include: {
                                guardian: true,
                            },
                        },
                    },
                },
                section: {
                    include: {
                        class: true,
                    },
                },
            },
            orderBy: { roll_number: 'asc' },
        });
        return enrollments.map((enr) => ({
            enrollmentId: enr.id,
            studentId: enr.student.id,
            admissionNumber: enr.student.admission_number,
            firstName: enr.student.first_name,
            lastName: enr.student.last_name,
            fullName: `${enr.student.first_name} ${enr.student.last_name || ''}`.trim(),
            rollNumber: enr.roll_number,
            gender: enr.student.gender,
            bloodGroup: enr.student.blood_group,
            dob: enr.student.date_of_birth,
            className: enr.section.class.name,
            sectionName: enr.section.name,
            primaryContact: enr.student.student_guardians.find((g) => g.is_primary_contact)?.guardian,
        }));
    }
    async getTeacherAssignments(schoolId, userId) {
        const assignments = await this.prisma.sectionSubjectTeacherAssignment.findMany({
            where: {
                school_id: schoolId,
                ...(userId ? { user_id: userId } : {}),
                status: 'ACTIVE',
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
                user: true,
                academic_year: true,
            },
        });
        return assignments.map((a) => ({
            id: a.id,
            teacherId: a.user_id,
            teacherName: `${a.user.first_name} ${a.user.last_name || ''}`.trim(),
            className: a.section.class.name,
            sectionName: a.section.name,
            sectionId: a.section_id,
            subjectName: a.class_subject.subject.name,
            subjectCode: a.class_subject.subject.code,
            academicYear: a.academic_year.name,
        }));
    }
    async createSubject(schoolId, dto) {
        return this.prisma.subject.create({
            data: {
                school_id: schoolId,
                name: dto.name.trim(),
                code: dto.code.trim().toUpperCase(),
                subject_type: dto.subjectType || 'ACADEMIC',
                description: dto.description || null,
                status: 'ACTIVE',
            },
        });
    }
    async deleteSubject(schoolId, subjectId) {
        const subject = await this.prisma.subject.findFirst({
            where: { id: subjectId, school_id: schoolId, deleted_at: null },
        });
        if (!subject) {
            throw new common_1.NotFoundException('Subject not found');
        }
        return this.prisma.subject.update({
            where: { id: subjectId },
            data: {
                status: 'INACTIVE',
                deleted_at: new Date(),
            },
        });
    }
};
exports.AcademicsService = AcademicsService;
exports.AcademicsService = AcademicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AcademicsService);
//# sourceMappingURL=academics.service.js.map