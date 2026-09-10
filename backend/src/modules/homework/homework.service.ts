import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async createHomework(schoolId: string, teacherId: string, dto: CreateHomeworkDto) {
    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, school_id: schoolId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
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

  async getSectionHomework(sectionId: string) {
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

  async getStudentHomework(studentId: string) {
    const enrollment = await this.prisma.studentEnrollment.findFirst({
      where: { student_id: studentId, status: 'ACTIVE', deleted_at: null },
    });

    if (!enrollment) {
      throw new NotFoundException('Active enrollment not found for student');
    }

    return this.getSectionHomework(enrollment.section_id);
  }

  async getHomeworkById(id: string) {
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
      throw new NotFoundException('Homework not found');
    }

    return hw;
  }
}
