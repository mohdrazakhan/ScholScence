import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardSchoolDto } from './dto/schools.dto';
import * as bcrypt from 'bcryptjs';

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

    let disabledServices: string[] = [];
    if (school.address_line2) {
      try {
        const parsed = JSON.parse(school.address_line2);
        if (Array.isArray(parsed.disabledServices)) {
          disabledServices = parsed.disabledServices;
        }
      } catch {}
    }

    return {
      ...school,
      disabledServices,
    };
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

  // ==========================================================================
  // SUPER ADMIN CAPABILITIES
  // ==========================================================================

  async getAllSchoolsWithStats() {
    const schools = await this.prisma.school.findMany({
      where: { deleted_at: null },
      include: {
        branches: { where: { status: 'ACTIVE', deleted_at: null } },
        academic_years: { where: { status: 'ACTIVE', deleted_at: null } },
        _count: {
          select: {
            students: { where: { deleted_at: null } },
            classes: { where: { deleted_at: null } },
            subjects: { where: { deleted_at: null } },
            user_school_roles: {
              where: {
                status: 'ACTIVE',
                deleted_at: null,
                role: { code: { not: 'SUPER_ADMIN' } },
              },
            },
          },
        },
        user_school_roles: {
          where: {
            status: 'ACTIVE',
            deleted_at: null,
            role: { code: 'SCHOOL_ADMIN' },
          },
          include: {
            user: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return schools.map((s) => {
      const adminRole = s.user_school_roles[0];
      const adminUser = adminRole?.user;

      let disabledServices: string[] = [];
      if (s.address_line2) {
        try {
          const parsed = JSON.parse(s.address_line2);
          if (Array.isArray(parsed.disabledServices)) {
            disabledServices = parsed.disabledServices;
          }
        } catch {}
      }

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        email: s.email,
        phone: s.phone,
        addressLine1: s.address_line1,
        city: s.city,
        state: s.state,
        postalCode: s.postal_code,
        status: s.status,
        disabledServices,
        createdAt: s.created_at,
        stats: {
          studentsCount: s._count.students,
          classesCount: s._count.classes,
          subjectsCount: s._count.subjects,
          totalStaffCount: s._count.user_school_roles,
        },
        admin: adminUser ? {
          id: adminUser.id,
          firstName: adminUser.first_name,
          lastName: adminUser.last_name,
          fullName: `${adminUser.first_name} ${adminUser.last_name || ''}`.trim(),
          email: adminUser.email,
          phone: adminUser.phone,
          status: adminUser.status,
        } : null,
      };
    });
  }

  async updateSchoolStatus(schoolId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId, deleted_at: null },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: { status },
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      message: `School "${updated.name}" is now ${updated.status}.`,
    };
  }

  async updateSchoolServices(schoolId: string, disabledServices: string[]) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId, deleted_at: null },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const payload = JSON.stringify({ disabledServices });

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: { address_line2: payload },
    });

    return {
      id: updated.id,
      name: updated.name,
      disabledServices,
      message: `Service restrictions updated successfully for "${updated.name}".`,
    };
  }

  async onboardSchool(dto: OnboardSchoolDto) {
    const normalizedCode = dto.code.trim().toUpperCase();
    const normalizedEmail = dto.adminEmail.trim().toLowerCase();

    // 1. Check if school code already exists
    const existingSchool = await this.prisma.school.findFirst({
      where: { code: normalizedCode, deleted_at: null },
    });
    if (existingSchool) {
      throw new BadRequestException(`A school with code "${normalizedCode}" already exists.`);
    }

    // 2. Check if admin user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deleted_at: null },
    });
    if (existingUser) {
      throw new BadRequestException(`A user with email "${normalizedEmail}" is already registered.`);
    }

    // 3. Find or ensure System Roles exist
    let adminRole = await this.prisma.role.findFirst({
      where: { code: 'SCHOOL_ADMIN', is_system_role: true },
    });
    if (!adminRole) {
      adminRole = await this.prisma.role.findFirst({
        where: { code: 'SCHOOL_ADMIN' },
      });
    }

    let superAdminRole = await this.prisma.role.findFirst({
      where: { code: 'SUPER_ADMIN' },
    });

    const passwordHash = await bcrypt.hash(dto.adminPassword || 'password123', 10);

    // 4. Atomic Onboarding Transaction
    return this.prisma.$transaction(async (tx) => {
      // Step A: Create School
      const school = await tx.school.create({
        data: {
          name: dto.name.trim(),
          code: normalizedCode,
          email: dto.email ? dto.email.trim() : null,
          phone: dto.phone ? dto.phone.trim() : null,
          address_line1: dto.addressLine1 ? dto.addressLine1.trim() : null,
          city: dto.city ? dto.city.trim() : null,
          state: dto.state ? dto.state.trim() : null,
          postal_code: dto.postalCode ? dto.postalCode.trim() : null,
          status: 'ACTIVE',
        },
      });

      // Step B: Create Main Branch
      const branch = await tx.schoolBranch.create({
        data: {
          school_id: school.id,
          name: `${school.name} - Main Campus`,
          code: `${normalizedCode}-MAIN`,
          city: dto.city || 'Campus City',
          state: dto.state || 'Campus State',
          status: 'ACTIVE',
        },
      });

      // Step C: Create Default Academic Year (2026-2027)
      const academicYear = await tx.academicYear.create({
        data: {
          school_id: school.id,
          name: 'AY 2026-27',
          start_date: new Date('2026-04-01'),
          end_date: new Date('2027-03-31'),
          is_current: true,
          status: 'ACTIVE',
        },
      });

      // Step D: Create Initial School Admin User
      const adminUser = await tx.user.create({
        data: {
          first_name: dto.adminFirstName.trim(),
          last_name: dto.adminLastName ? dto.adminLastName.trim() : null,
          email: normalizedEmail,
          phone: dto.adminPhone ? dto.adminPhone.trim() : null,
          password_hash: passwordHash,
          status: 'ACTIVE',
        },
      });

      // Link Admin User to School with SCHOOL_ADMIN role
      if (adminRole) {
        await tx.userSchoolRole.create({
          data: {
            user_id: adminUser.id,
            school_id: school.id,
            role_id: adminRole.id,
            status: 'ACTIVE',
          },
        });
      }

      // Step E: Link Super Admin user (dev@schoolsense.in) if exists to this new school
      const devUser = await tx.user.findFirst({
        where: { email: 'dev@schoolsense.in', deleted_at: null },
      });
      if (devUser && superAdminRole) {
        await tx.userSchoolRole.create({
          data: {
            user_id: devUser.id,
            school_id: school.id,
            role_id: superAdminRole.id,
            status: 'ACTIVE',
          },
        });
      }

      return {
        school: {
          id: school.id,
          name: school.name,
          code: school.code,
          email: school.email,
          city: school.city,
          state: school.state,
        },
        admin: {
          id: adminUser.id,
          fullName: `${adminUser.first_name} ${adminUser.last_name || ''}`.trim(),
          email: adminUser.email,
          phone: adminUser.phone,
          role: 'SCHOOL_ADMIN',
        },
        message: `School "${school.name}" onboarded successfully with initial School Administrator ${adminUser.email}.`,
      };
    });
  }
}
