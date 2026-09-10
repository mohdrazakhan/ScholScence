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
exports.HomeworkService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let HomeworkService = class HomeworkService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createHomework(schoolId, teacherId, dto) {
        const section = await this.prisma.section.findFirst({
            where: { id: dto.sectionId, school_id: schoolId },
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found');
        }
        const homework = await this.prisma.homework.create({
            data: {
                school_id: schoolId,
                academic_year_id: section.academic_year_id,
                section_id: dto.sectionId,
                class_subject_id: dto.classSubjectId,
                teacher_id: teacherId,
                title: dto.title,
                description: dto.description,
                due_date: new Date(dto.dueDate),
                status: 'PUBLISHED',
                attachments: dto.attachmentUrl
                    ? {
                        create: {
                            file_name: dto.attachmentFileName || 'attachment.pdf',
                            file_url: dto.attachmentUrl,
                        },
                    }
                    : undefined,
            },
            include: {
                class_subject: {
                    include: {
                        subject: true,
                    },
                },
                attachments: true,
            },
        });
        return homework;
    }
    async getSectionHomework(sectionId) {
        return this.prisma.homework.findMany({
            where: { section_id: sectionId, status: 'PUBLISHED', deleted_at: null },
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
                    },
                },
                attachments: true,
            },
            orderBy: { due_date: 'desc' },
        });
    }
    async getStudentHomework(studentId) {
        const enrollment = await this.prisma.studentEnrollment.findFirst({
            where: { student_id: studentId, status: 'ACTIVE', deleted_at: null },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Active enrollment not found for student');
        }
        return this.getSectionHomework(enrollment.section_id);
    }
    async getHomeworkById(id) {
        const hw = await this.prisma.homework.findUnique({
            where: { id },
            include: {
                class_subject: {
                    include: {
                        subject: true,
                        class: true,
                    },
                },
                section: true,
                teacher: {
                    select: {
                        first_name: true,
                        last_name: true,
                    },
                },
                attachments: true,
            },
        });
        if (!hw) {
            throw new common_1.NotFoundException('Homework not found');
        }
        return hw;
    }
};
exports.HomeworkService = HomeworkService;
exports.HomeworkService = HomeworkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HomeworkService);
//# sourceMappingURL=homework.service.js.map