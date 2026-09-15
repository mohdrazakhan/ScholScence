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
const bcrypt = require("bcryptjs");
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
    async getStaff(schoolId) {
        const roles = await this.prisma.userSchoolRole.findMany({
            where: {
                school_id: schoolId,
                status: 'ACTIVE',
                deleted_at: null,
                role: {
                    code: { in: ['PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'SCHOOL_ADMIN'] },
                },
            },
            include: {
                user: {
                    include: {
                        section_teacher_assignments: {
                            where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
                            include: {
                                section: {
                                    include: { class: true },
                                },
                            },
                        },
                        section_subject_teacher_assignments: {
                            where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
                            include: {
                                section: {
                                    include: { class: true },
                                },
                                class_subject: {
                                    include: { subject: true },
                                },
                            },
                        },
                    },
                },
                role: true,
            },
            orderBy: { created_at: 'desc' },
        });
        const staffMap = new Map();
        for (const usr of roles) {
            if (!staffMap.has(usr.user.id)) {
                const u = usr.user;
                const classTeacherSections = u.section_teacher_assignments.map((sta) => ({
                    sectionId: sta.section_id,
                    sectionName: sta.section.name,
                    className: sta.section.class.name,
                }));
                const subjectAssignments = u.section_subject_teacher_assignments.map((ssta) => ({
                    sectionId: ssta.section_id,
                    sectionName: ssta.section.name,
                    className: ssta.section.class.name,
                    subjectName: ssta.class_subject.subject.name,
                    subjectCode: ssta.class_subject.subject.code,
                }));
                staffMap.set(u.id, {
                    id: u.id,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    fullName: `${u.first_name} ${u.last_name || ''}`.trim(),
                    email: u.email,
                    phone: u.phone,
                    role: usr.role.code,
                    roleName: usr.role.name,
                    classTeacherSections,
                    subjectAssignments,
                    status: u.status,
                    createdAt: u.created_at,
                });
            }
        }
        return Array.from(staffMap.values());
    }
    async createStaff(schoolId, dto) {
        const existing = await this.prisma.user.findFirst({
            where: { email: dto.email.trim().toLowerCase(), deleted_at: null },
        });
        if (existing) {
            throw new common_1.BadRequestException('A user with this email address already exists.');
        }
        const roleRecord = await this.prisma.role.findFirst({
            where: {
                code: dto.role,
                OR: [{ school_id: schoolId }, { is_system_role: true }],
            },
        });
        if (!roleRecord) {
            throw new common_1.BadRequestException(`Role ${dto.role} is not configured in this school.`);
        }
        const passwordHash = await bcrypt.hash(dto.password || 'password123', 10);
        const user = await this.prisma.user.create({
            data: {
                first_name: dto.firstName.trim(),
                last_name: dto.lastName ? dto.lastName.trim() : null,
                email: dto.email.trim().toLowerCase(),
                phone: dto.phone ? dto.phone.trim() : null,
                password_hash: passwordHash,
                status: 'ACTIVE',
                user_school_roles: {
                    create: {
                        school_id: schoolId,
                        role_id: roleRecord.id,
                        status: 'ACTIVE',
                    },
                },
            },
        });
        if (dto.classTeacherSectionId) {
            const section = await this.prisma.section.findUnique({
                where: { id: dto.classTeacherSectionId },
            });
            if (section) {
                await this.prisma.sectionTeacherAssignment.create({
                    data: {
                        school_id: schoolId,
                        section_id: dto.classTeacherSectionId,
                        user_id: user.id,
                        academic_year_id: section.academic_year_id,
                        status: 'ACTIVE',
                    },
                });
            }
        }
        if (dto.sectionId && dto.subjectId) {
            const section = await this.prisma.section.findUnique({
                where: { id: dto.sectionId },
                include: { class: true },
            });
            if (section) {
                let classSubject = await this.prisma.classSubject.findFirst({
                    where: {
                        class_id: section.class_id,
                        subject_id: dto.subjectId,
                        academic_year_id: section.academic_year_id,
                    },
                });
                if (!classSubject) {
                    classSubject = await this.prisma.classSubject.create({
                        data: {
                            class_id: section.class_id,
                            subject_id: dto.subjectId,
                            academic_year_id: section.academic_year_id,
                            status: 'ACTIVE',
                        },
                    });
                }
                await this.prisma.sectionSubjectTeacherAssignment.create({
                    data: {
                        school_id: schoolId,
                        section_id: dto.sectionId,
                        class_subject_id: classSubject.id,
                        user_id: user.id,
                        academic_year_id: section.academic_year_id,
                        status: 'ACTIVE',
                    },
                });
            }
        }
        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: dto.role,
        };
    }
    async createStudent(schoolId, dto) {
        const section = await this.prisma.section.findUnique({
            where: { id: dto.sectionId },
            include: { class: true },
        });
        if (!section) {
            throw new common_1.NotFoundException('Selected class section not found');
        }
        const existingAdmission = await this.prisma.student.findFirst({
            where: { school_id: schoolId, admission_number: dto.admissionNumber.trim(), deleted_at: null },
        });
        if (existingAdmission) {
            throw new common_1.BadRequestException(`Admission number ${dto.admissionNumber} already exists in this school.`);
        }
        const student = await this.prisma.student.create({
            data: {
                school_id: schoolId,
                first_name: dto.firstName.trim(),
                last_name: dto.lastName ? dto.lastName.trim() : null,
                admission_number: dto.admissionNumber.trim(),
                date_of_birth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
                gender: dto.gender || 'MALE',
                blood_group: dto.bloodGroup || null,
                status: 'ACTIVE',
                student_enrollments: {
                    create: {
                        section_id: dto.sectionId,
                        academic_year_id: section.academic_year_id,
                        roll_number: dto.rollNumber || null,
                        status: 'ACTIVE',
                    },
                },
            },
        });
        if (dto.guardianName || dto.guardianEmail || dto.guardianPhone) {
            let guardian = dto.guardianPhone
                ? await this.prisma.guardian.findFirst({
                    where: { school_id: schoolId, phone: dto.guardianPhone.trim() },
                })
                : null;
            if (!guardian) {
                const parts = (dto.guardianName || 'Parent').trim().split(' ');
                const fName = parts[0];
                const lName = parts.slice(1).join(' ') || undefined;
                let parentUser = dto.guardianEmail
                    ? await this.prisma.user.findFirst({
                        where: { email: dto.guardianEmail.trim().toLowerCase() },
                    })
                    : null;
                if (!parentUser && dto.guardianEmail) {
                    const parentRole = await this.prisma.role.findFirst({
                        where: { code: 'GUARDIAN' },
                    });
                    const passwordHash = await bcrypt.hash('password123', 10);
                    parentUser = await this.prisma.user.create({
                        data: {
                            first_name: fName,
                            last_name: lName || null,
                            email: dto.guardianEmail.trim().toLowerCase(),
                            phone: dto.guardianPhone ? dto.guardianPhone.trim() : null,
                            password_hash: passwordHash,
                            status: 'ACTIVE',
                            ...(parentRole
                                ? {
                                    user_school_roles: {
                                        create: {
                                            school_id: schoolId,
                                            role_id: parentRole.id,
                                            status: 'ACTIVE',
                                        },
                                    },
                                }
                                : {}),
                        },
                    });
                }
                guardian = await this.prisma.guardian.create({
                    data: {
                        school_id: schoolId,
                        user_id: parentUser?.id || null,
                        first_name: fName,
                        last_name: lName || null,
                        email: dto.guardianEmail ? dto.guardianEmail.trim() : null,
                        phone: dto.guardianPhone ? dto.guardianPhone.trim() : '+91 99999 99999',
                        status: 'ACTIVE',
                    },
                });
            }
            await this.prisma.studentGuardian.create({
                data: {
                    school_id: schoolId,
                    student_id: student.id,
                    guardian_id: guardian.id,
                    relationship_type: dto.relationship || 'GUARDIAN',
                    is_primary_contact: true,
                    status: 'ACTIVE',
                },
            });
        }
        return {
            studentId: student.id,
            admissionNumber: student.admission_number,
            fullName: `${student.first_name} ${student.last_name || ''}`.trim(),
            className: section.class.name,
            sectionName: section.name,
        };
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
        await this.prisma.classSubject.updateMany({
            where: { subject_id: subjectId },
            data: {
                status: 'INACTIVE',
                deleted_at: new Date(),
            },
        });
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