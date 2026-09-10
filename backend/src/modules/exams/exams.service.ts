import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkEnterMarksDto } from './dto/enter-marks.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async getExams(schoolId: string) {
    return this.prisma.exam.findMany({
      where: { school_id: schoolId, deleted_at: null },
      include: {
        academic_year: true,
        grading_scheme: true,
        exam_subjects: {
          include: {
            class_subject: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });
  }

  async getExamSubjects(examId: string) {
    return this.prisma.examSubject.findMany({
      where: { exam_id: examId },
      include: {
        class_subject: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: { exam_date: 'asc' },
    });
  }

  async getExamSubjectMarks(examSubjectId: string, sectionId?: string) {
    const examSubject = await this.prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: {
        class_subject: {
          include: {
            subject: true,
            class: true,
          },
        },
        exam: true,
      },
    });

    if (!examSubject) {
      throw new NotFoundException('Exam subject not found');
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        section: {
          class_id: examSubject.class_subject.class_id,
          ...(sectionId ? { id: sectionId } : {}),
        },
        status: 'ACTIVE',
        deleted_at: null,
      },
      include: {
        student: true,
        section: true,
      },
      orderBy: [{ section: { name: 'asc' } }, { roll_number: 'asc' }],
    });

    const marks = await this.prisma.studentMark.findMany({
      where: { exam_subject_id: examSubjectId },
    });

    const marksMap = new Map<string, any>();
    for (const m of marks) {
      marksMap.set(m.student_id, m);
    }

    const students = enrollments.map((e) => {
      const markRecord = marksMap.get(e.student_id);
      return {
        studentId: e.student_id,
        enrollmentId: e.id,
        rollNumber: e.roll_number,
        admissionNumber: e.student.admission_number,
        name: `${e.student.first_name} ${e.student.last_name || ''}`.trim(),
        sectionName: e.section.name,
        sectionId: e.section_id,
        marksObtained: markRecord?.marks_obtained != null ? Number(markRecord.marks_obtained) : null,
        isAbsent: markRecord?.is_absent || false,
        grade: markRecord?.grade || '',
        remarks: markRecord?.remarks || '',
      };
    });

    return {
      examSubject,
      students,
    };
  }

  async enterMarksBulk(schoolId: string, teacherId: string, dto: BulkEnterMarksDto) {
    const examSubject = await this.prisma.examSubject.findUnique({
      where: { id: dto.examSubjectId },
      include: { exam: true },
    });

    if (!examSubject) {
      throw new NotFoundException('Exam subject not found');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.marks) {
        await tx.studentMark.upsert({
          where: {
            exam_subject_id_student_id: {
              exam_subject_id: dto.examSubjectId,
              student_id: item.studentId,
            },
          },
          update: {
            marks_obtained: item.marksObtained != null ? item.marksObtained : null,
            is_absent: item.isAbsent || false,
            grade: item.grade || null,
            remarks: item.remarks || null,
            entered_by: teacherId,
          },
          create: {
            school_id: schoolId,
            exam_subject_id: dto.examSubjectId,
            student_id: item.studentId,
            marks_obtained: item.marksObtained != null ? item.marksObtained : null,
            is_absent: item.isAbsent || false,
            grade: item.grade || null,
            remarks: item.remarks || null,
            entered_by: teacherId,
          },
        });
      }
    });

    return {
      message: 'Marks updated successfully',
      count: dto.marks.length,
      examSubjectId: dto.examSubjectId,
    };
  }

  async getStudentReportCard(studentId: string, examId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        student_enrollments: {
          where: { status: 'ACTIVE', deleted_at: null },
          include: {
            section: {
              include: {
                class: true,
              },
            },
            academic_year: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const marks = await this.prisma.studentMark.findMany({
      where: {
        student_id: studentId,
        ...(examId ? { exam_subject: { exam_id: examId } } : {}),
      },
      include: {
        exam_subject: {
          include: {
            exam: {
              include: {
                grading_scheme: true,
              },
            },
            class_subject: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    const activeEnrollment = student.student_enrollments[0];

    const subjectResults = marks.map((m) => ({
      examName: m.exam_subject.exam.name,
      subjectName: m.exam_subject.class_subject.subject.name,
      subjectCode: m.exam_subject.class_subject.subject.code,
      maxMarks: Number(m.exam_subject.max_marks),
      passingMarks: Number(m.exam_subject.passing_marks),
      marksObtained: m.marks_obtained ? Number(m.marks_obtained) : 0,
      isAbsent: m.is_absent,
      grade: m.grade || 'A',
      remarks: m.remarks,
    }));

    const totalMax = subjectResults.reduce((acc, curr) => acc + curr.maxMarks, 0);
    const totalObtained = subjectResults.reduce((acc, curr) => acc + curr.marksObtained, 0);
    const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

    return {
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name || ''}`.trim(),
        admissionNumber: student.admission_number,
        className: activeEnrollment?.section?.class?.name,
        sectionName: activeEnrollment?.section?.name,
        rollNumber: activeEnrollment?.roll_number,
        academicYear: activeEnrollment?.academic_year?.name,
      },
      summary: {
        totalSubjects: subjectResults.length,
        totalMaxMarks: totalMax,
        totalMarksObtained: totalObtained,
        overallPercentage: percentage,
      },
      subjectResults,
    };
  }
}
