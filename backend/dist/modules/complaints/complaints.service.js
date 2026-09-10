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
    async getComplaints(schoolId, guardianId) {
        return this.prisma.complaint.findMany({
            where: {
                school_id: schoolId,
                ...(guardianId ? { guardian_id: guardianId } : {}),
                deleted_at: null,
            },
            include: {
                guardian: true,
                student: true,
                messages: {
                    orderBy: { created_at: 'asc' },
                    include: {
                        sender: {
                            select: {
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
    async getComplaintById(id) {
        const complaint = await this.prisma.complaint.findUnique({
            where: { id },
            include: {
                guardian: true,
                student: true,
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
        });
        if (!complaint) {
            throw new common_1.NotFoundException('Complaint ticket not found');
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
                messages: true,
            },
        });
        return complaint;
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
                        first_name: true,
                        last_name: true,
                    },
                },
            },
        });
        return message;
    }
    async updateStatus(complaintId, status) {
        return this.prisma.complaint.update({
            where: { id: complaintId },
            data: {
                status,
                ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolved_at: new Date() } : {}),
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