import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimetablePeriodDto, BulkUpsertTimetableDto } from './dto/timetable.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const DAY_MAP: Record<number, string> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

const REVERSE_DAY_MAP: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user is permitted to edit a section's timetable
   */
  private async checkEditPermission(schoolId: string, sectionId: string, user: AuthenticatedUser) {
    const role = user.role || '';
    const isPrincipal = role === 'PRINCIPAL';
    const isSchoolAdmin = role === 'SCHOOL_ADMIN' || role === 'ADMIN';

    if (isPrincipal || isSchoolAdmin) {
      return true;
    }

    // Check if user is the assigned Class Teacher for this section
    const assignment = await this.prisma.sectionTeacherAssignment.findFirst({
      where: {
        school_id: schoolId,
        section_id: sectionId,
        user_id: user.userId,
        deleted_at: null,
      },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'Access denied: Only Principals, School Admins, and the assigned Class Teacher can modify this timetable.',
      );
    }

    return true;
  }

  /**
   * Get weekly timetable for a given section
   */
  async getSectionTimetable(schoolId: string, sectionId: string) {
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
      throw new NotFoundException('Class Section not found');
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

  /**
   * Get teaching schedule for a teacher across all sections
   */
  async getTeacherTimetable(schoolId: string, teacherId: string) {
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

  /**
   * Get timetable for parent's linked child/children
   */
  async getMyChildTimetable(schoolId: string, parentUserId: string, targetStudentId?: string) {
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

    const childrenMap = new Map<string, any>();
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

  /**
   * Add or update a single timetable period
   */
  async savePeriod(schoolId: string, user: AuthenticatedUser, dto: CreateTimetablePeriodDto) {
    await this.checkEditPermission(schoolId, dto.sectionId, user);

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, school_id: schoolId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
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

  /**
   * Bulk replace or save a weekly timetable for a section
   */
  async bulkSaveSectionTimetable(
    schoolId: string,
    sectionId: string,
    user: AuthenticatedUser,
    dto: BulkUpsertTimetableDto,
  ) {
    await this.checkEditPermission(schoolId, sectionId, user);

    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, school_id: schoolId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    // Execute in transaction
    await this.prisma.$transaction(async (tx) => {
      // Clear existing periods for this section
      await tx.timetablePeriod.deleteMany({
        where: {
          school_id: schoolId,
          section_id: sectionId,
        },
      });

      // Insert new periods
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

  /**
   * Delete a period slot
   */
  async deletePeriod(schoolId: string, periodId: string, user: AuthenticatedUser) {
    const period = await this.prisma.timetablePeriod.findFirst({
      where: { id: periodId, school_id: schoolId },
    });

    if (!period) {
      throw new NotFoundException('Timetable period not found');
    }

    await this.checkEditPermission(schoolId, period.section_id, user);

    await this.prisma.timetablePeriod.delete({
      where: { id: periodId },
    });

    return { message: 'Period removed successfully', id: periodId };
  }
}
