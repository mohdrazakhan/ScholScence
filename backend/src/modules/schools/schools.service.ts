import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async getCurrentSchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        branches: { where: { status: 'ACTIVE', deleted_at: null } },
        academic_years: { where: { status: 'ACTIVE', deleted_at: null }, orderBy: { start_date: 'desc' } },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async getAcademicYears(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
      orderBy: { start_date: 'desc' },
    });
  }

  async getPublicSchools() {
    return this.prisma.school.findMany({
      where: { status: 'ACTIVE', deleted_at: null },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        state: true,
        address_line1: true,
        phone: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getBranches(schoolId: string) {
    return this.prisma.schoolBranch.findMany({
      where: { school_id: schoolId, status: 'ACTIVE', deleted_at: null },
      orderBy: { name: 'asc' },
    });
  }
}
