import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            lastName: string;
            role: string;
            roleName: string;
            school: {
                id: string;
                name: string;
                code: string;
            };
            permissions: string[];
            children: {
                id: string;
                admissionNumber: string;
                name: string;
                className: string;
                sectionName: string;
                sectionId: string;
                rollNumber: string;
                relationship: string;
                isPrimaryContact: boolean;
            }[];
            teachingScope: {
                classTeacherSections: {
                    sectionId: string;
                    className: string;
                    sectionName: string;
                    academicYear: string;
                }[];
                subjectAssignments: {
                    assignmentId: string;
                    sectionId: string;
                    className: string;
                    sectionName: string;
                    subjectId: string;
                    subjectName: string;
                    subjectCode: string;
                    classSubjectId: string;
                }[];
            };
        };
    }>;
    getMe(userId: string, schoolId: string): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        role: string;
        roleName: string;
        school: {
            id: string;
            name: string;
            code: string;
        };
        permissions: string[];
        children: {
            id: string;
            admissionNumber: string;
            name: string;
            className: string;
            sectionName: string;
            sectionId: string;
            rollNumber: string;
            relationship: string;
            isPrimaryContact: boolean;
        }[];
        teachingScope: {
            classTeacherSections: {
                sectionId: string;
                className: string;
                sectionName: string;
                academicYear: string;
            }[];
            subjectAssignments: {
                assignmentId: string;
                sectionId: string;
                className: string;
                sectionName: string;
                subjectId: string;
                subjectName: string;
                subjectCode: string;
                classSubjectId: string;
            }[];
        };
    }>;
}
