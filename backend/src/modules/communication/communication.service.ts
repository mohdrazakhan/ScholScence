import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateNoticeDto {
  title: string;
  content: string;
  targetAudience?: string;
  expiresAt?: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isHoliday?: boolean;
  targetAudience?: string;
}

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  async getNotices(schoolId: string, role?: string) {
    return this.prisma.notice.findMany({
      where: {
        school_id: schoolId,
        status: 'PUBLISHED',
        deleted_at: null,
      },
      include: {
        publisher: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { published_at: 'desc' },
    });
  }

  async createNotice(schoolId: string, userId: string, dto: CreateNoticeDto) {
    const currentYear = await this.prisma.academicYear.findFirst({
      where: { school_id: schoolId, is_current: true, status: 'ACTIVE', deleted_at: null },
    });

    if (!currentYear) {
      throw new NotFoundException('Active academic year not found');
    }

    return this.prisma.notice.create({
      data: {
        school_id: schoolId,
        academic_year_id: currentYear.id,
        title: dto.title,
        content: dto.content,
        target_audience: dto.targetAudience || 'ALL',
        published_by: userId,
        status: 'PUBLISHED',
        expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        publisher: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  async getEvents(schoolId: string) {
    return this.prisma.schoolEvent.findMany({
      where: {
        school_id: schoolId,
      },
      include: {
        creator: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { start_time: 'asc' },
    });
  }

  async createEvent(schoolId: string, userId: string, dto: CreateEventDto) {
    const currentYear = await this.prisma.academicYear.findFirst({
      where: { school_id: schoolId, is_current: true, status: 'ACTIVE', deleted_at: null },
    });

    if (!currentYear) {
      throw new NotFoundException('Active academic year not found');
    }

    return this.prisma.schoolEvent.create({
      data: {
        school_id: schoolId,
        academic_year_id: currentYear.id,
        title: dto.title,
        description: dto.description || null,
        start_time: new Date(dto.startTime),
        end_time: new Date(dto.endTime),
        location: dto.location || null,
        is_holiday: dto.isHoliday || false,
        target_audience: dto.targetAudience || 'ALL',
        created_by: userId,
      },
    });
  }
}
