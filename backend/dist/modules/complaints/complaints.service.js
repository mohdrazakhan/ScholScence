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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ComplaintsService = class ComplaintsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getComplaints(schoolId, user, filters) {
        const role = user.role;
        if (role === 'PARENT' || role === 'GUARDIAN') {
            const guardians = await this.prisma.guardian.findMany({
                where: { user_id: user.userId, school_id: schoolId },
                select: { id: true },
            });
            if (guardians.length === 0) {
                return [];
            }
            const guardianIds = guardians.map((g) => g.id);
            const tickets = await this.prisma.complaint.findMany({
                where: {
                    school_id: schoolId,
                    guardian_id: { in: guardianIds },
                    deleted_at: null,
                    ...(filters?.status && filters.status !== 'ALL' ? { status: filters.status } : {}),
                    ...(filters?.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
                },
                include: {
                    guardian: true,
                    student: {
                        include: {
                            student_enrollments: {
                                where: { status: 'ACTIVE' },
                                include: {
                                    section: {
                                        include: { class: true },
                                    },
                                },
                            },
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                    messages: {
                        where: { is_internal_note: false },
                        orderBy: { created_at: 'asc' },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            });
            return tickets;
        }
        if (role === 'TEACHER' || role === 'CLASS_TEACHER') {
            const classTeacherAssignments = await this.prisma.sectionTeacherAssignment.findMany({
                where: {
                    user_id: user.userId,
                    school_id: schoolId,
                    status: 'ACTIVE',
                    deleted_at: null,
                },
                select: { section_id: true },
            });
            const classTeacherSectionIds = classTeacherAssignments.map((a) => a.section_id);
            const whereClause = {
                school_id: schoolId,
                deleted_at: null,
                ...(filters?.status && filters.status !== 'ALL' ? { status: filters.status } : {}),
                ...(filters?.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
            };
            if (filters?.scope === 'CLASS_TEACHER') {
                if (classTeacherSectionIds.length === 0)
                    return [];
                whereClause.student = {
                    student_enrollments: {
                        some: {
                            section_id: { in: classTeacherSectionIds },
                            status: 'ACTIVE',
                        },
                    },
                };
            }
            else if (filters?.scope === 'ASSIGNED') {
                whereClause.assigned_to = user.userId;
            }
            else {
                if (classTeacherSectionIds.length > 0) {
                    whereClause.OR = [
                        { assigned_to: user.userId },
                        {
                            student: {
                                student_enrollments: {
                                    some: {
                                        section_id: { in: classTeacherSectionIds },
                                        status: 'ACTIVE',
                                    },
                                },
                            },
                        },
                    ];
                }
                else {
                    whereClause.assigned_to = user.userId;
                }
            }
            const tickets = await this.prisma.complaint.findMany({
                where: whereClause,
                include: {
                    guardian: true,
                    student: {
                        include: {
                            student_enrollments: {
                                where: { status: 'ACTIVE' },
                                include: {
                                    section: {
                                        include: { class: true },
                                    },
                                },
                            },
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                    messages: {
                        orderBy: { created_at: 'asc' },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            });
            return tickets.map((t) => {
                const studentSectionId = t.student?.student_enrollments?.[0]?.section_id;
                const isClassTeacherTicket = studentSectionId ? classTeacherSectionIds.includes(studentSectionId) : false;
                const isAssignedToMe = t.assigned_to === user.userId;
                return {
                    ...t,
                    isClassTeacherTicket,
                    isAssignedToMe,
                };
            });
        }
        const whereClause = {
            school_id: schoolId,
            deleted_at: null,
            ...(filters?.status && filters.status !== 'ALL' ? { status: filters.status } : {}),
            ...(filters?.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
        };
        if (filters?.sectionId && filters.sectionId !== 'ALL') {
            whereClause.student = {
                student_enrollments: {
                    some: { section_id: filters.sectionId, status: 'ACTIVE' },
                },
            };
        }
        else if (filters?.classId && filters.classId !== 'ALL') {
            whereClause.student = {
                student_enrollments: {
                    some: {
                        section: { class_id: filters.classId },
                        status: 'ACTIVE',
                    },
                },
            };
        }
        return this.prisma.complaint.findMany({
            where: whereClause,
            include: {
                guardian: true,
                student: {
                    include: {
                        student_enrollments: {
                            where: { status: 'ACTIVE' },
                            include: {
                                section: {
                                    include: { class: true },
                                },
                            },
                        },
                    },
                },
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: { created_at: 'asc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async getMyChildren(schoolId, userId) {
        const guardians = await this.prisma.guardian.findMany({
            where: { user_id: userId, school_id: schoolId },
            select: { id: true },
        });
        if (guardians.length === 0) {
            return [];
        }
        const guardianIds = guardians.map((g) => g.id);
        const links = await this.prisma.studentGuardian.findMany({
            where: {
                guardian_id: { in: guardianIds },
                school_id: schoolId,
                status: 'ACTIVE',
                deleted_at: null,
            },
            include: {
                student: {
                    include: {
                        student_enrollments: {
                            where: { status: 'ACTIVE', deleted_at: null },
                            include: {
                                section: {
                                    include: {
                                        class: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const studentMap = new Map();
        for (const l of links) {
            if (!studentMap.has(l.student.id)) {
                const enrollment = l.student.student_enrollments[0];
                studentMap.set(l.student.id, {
                    studentId: l.student.id,
                    admissionNumber: l.student.admission_number,
                    firstName: l.student.first_name,
                    lastName: l.student.last_name,
                    fullName: `${l.student.first_name} ${l.student.last_name || ''}`.trim(),
                    className: enrollment?.section?.class?.name || 'N/A',
                    sectionName: enrollment?.section?.name || 'N/A',
                    sectionId: enrollment?.section_id,
                    relationship: l.relationship_type,
                });
            }
        }
        return Array.from(studentMap.values());
    }
    async getFaculty(schoolId) {
        const staffRoles = await this.prisma.userSchoolRole.findMany({
            where: {
                school_id: schoolId,
                status: 'ACTIVE',
                deleted_at: null,
                role: {
                    code: { in: ['TEACHER', 'CLASS_TEACHER', 'PRINCIPAL', 'SCHOOL_ADMIN'] },
                },
            },
            include: {
                user: true,
                role: true,
            },
            orderBy: {
                user: { first_name: 'asc' },
            },
        });
        const facultyMap = new Map();
        for (const r of staffRoles) {
            if (!facultyMap.has(r.user_id)) {
                facultyMap.set(r.user_id, {
                    id: r.user.id,
                    name: `${r.user.first_name} ${r.user.last_name || ''}`.trim(),
                    email: r.user.email,
                    role: r.role.code,
                });
            }
        }
        return Array.from(facultyMap.values());
    }
    async getComplaintById(id, user) {
        const isParent = user?.role === 'PARENT' || user?.role === 'GUARDIAN';
        const complaint = await this.prisma.complaint.findUnique({
            where: { id },
            include: {
                guardian: true,
                student: {
                    include: {
                        student_enrollments: {
                            include: {
                                section: {
                                    include: { class: true },
                                },
                            },
                        },
                    },
                },
                users: true,
                messages: {
                    where: isParent ? { is_internal_note: false } : undefined,
                    orderBy: { created_at: 'asc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!complaint) {
            throw new common_1.NotFoundException('Complaint ticket not found');
        }
        if (isParent && user) {
            const guardians = await this.prisma.guardian.findMany({
                where: { user_id: user.userId },
                select: { id: true },
            });
            const guardianIds = guardians.map((g) => g.id);
            if (!guardianIds.includes(complaint.guardian_id)) {
                throw new common_1.ForbiddenException('Access denied: You are not authorized to view this ticket.');
            }
        }
        return complaint;
    }
    async createComplaint(schoolId, userId, dto) {
        const guardian = await this.prisma.guardian.findFirst({
            where: { user_id: userId, school_id: schoolId },
        });
        if (!guardian) {
            throw new common_1.NotFoundException('Guardian profile not found for this user');
        }
        const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const complaint = await this.prisma.complaint.create({
            data: {
                school_id: schoolId,
                guardian_id: guardian.id,
                student_id: dto.studentId || null,
                ticket_number: ticketNumber,
                category: dto.category,
                subject: dto.subject,
                priority: dto.priority || 'MEDIUM',
                status: 'OPEN',
                messages: {
                    create: {
                        sender_user_id: userId,
                        message: dto.message,
                    },
                },
            },
            include: {
                guardian: true,
                student: {
                    include: {
                        student_enrollments: {
                            include: {
                                section: {
                                    include: { class: true },
                                },
                            },
                        },
                    },
                },
                users: true,
                messages: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
            },
        });
        return complaint;
    }
    async assignComplaint(complaintId, schoolId, user, assignedToUserId, note) {
        const complaint = await this.prisma.complaint.findFirst({
            where: { id: complaintId, school_id: schoolId, deleted_at: null },
            include: {
                student: {
                    include: {
                        student_enrollments: true,
                    },
                },
            },
        });
        if (!complaint) {
            throw new common_1.NotFoundException('Complaint not found');
        }
        let assigneeName = 'Unassigned';
        if (assignedToUserId) {
            const assignee = await this.prisma.user.findUnique({
                where: { id: assignedToUserId },
            });
            if (assignee) {
                assigneeName = `${assignee.first_name} ${assignee.last_name || ''}`.trim();
            }
        }
        await this.prisma.complaint.update({
            where: { id: complaintId },
            data: {
                assigned_to: assignedToUserId,
                status: complaint.status === 'OPEN' ? 'IN_PROGRESS' : complaint.status,
            },
        });
        const assignerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.role;
        const msgText = note
            ? `[Subject Delegation Note] Reassigned ticket to ${assigneeName}. Note: ${note}`
            : `[System] Ticket delegated to ${assigneeName} by ${assignerName}.`;
        await this.prisma.complaintMessage.create({
            data: {
                complaint_id: complaintId,
                sender_user_id: user.userId,
                message: msgText,
                is_internal_note: true,
            },
        });
        return this.getComplaintById(complaintId, user);
    }
    async addMessage(complaintId, userId, dto) {
        const complaint = await this.prisma.complaint.findUnique({
            where: { id: complaintId },
        });
        if (!complaint) {
            throw new common_1.NotFoundException('Complaint not found');
        }
        const message = await this.prisma.complaintMessage.create({
            data: {
                complaint_id: complaintId,
                sender_user_id: userId,
                message: dto.message,
                is_internal_note: dto.isInternalNote || false,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
            },
        });
        return message;
    }
    async updateStatus(id, status) {
        return this.prisma.complaint.update({
            where: { id },
            data: { status },
            include: {
                guardian: true,
                student: true,
                users: true,
            },
        });
    }
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map