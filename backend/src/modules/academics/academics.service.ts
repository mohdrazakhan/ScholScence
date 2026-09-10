import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  async getClasses(schoolId: string) {
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

  async getSections(schoolId: string, classId?: string) {
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

  async getSubjects(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
      orderBy: { display_order: 'asc' },
    });
  }

  async getClassSubjects(classId: string, academicYearId?: string) {
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

  async getStudentsBySection(sectionId: string) {
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

  async getTeacherAssignments(schoolId: string, userId?: string) {
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

  async createSubject(
    schoolId: string,
    dto: { name: string; code: string; subjectType?: string; description?: string },
  ) {
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

  async deleteSubject(schoolId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, school_id: schoolId, deleted_at: null },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        status: 'INACTIVE',
        deleted_at: new Date(),
      },
    });
  }
}
