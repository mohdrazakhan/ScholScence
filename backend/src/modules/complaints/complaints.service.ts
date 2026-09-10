import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateComplaintDto {
  category: string;
  subject: string;
  message: string;
  studentId?: string;
  priority?: string;
}

export interface AddMessageDto {
  message: string;
  isInternalNote?: boolean;
}

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async getComplaints(schoolId: string, guardianId?: string) {
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

  async getComplaintById(id: string) {
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
      throw new NotFoundException('Complaint ticket not found');
    }

    return complaint;
  }

  async createComplaint(schoolId: string, userId: string, dto: CreateComplaintDto) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { user_id: userId, school_id: schoolId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian profile not found for this user');
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

  async addMessage(complaintId: string, userId: string, dto: AddMessageDto) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
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

  async updateStatus(complaintId: string, status: string) {
    return this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status,
        ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolved_at: new Date() } : {}),
      },
    });
  }
}
