import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getMe(user: AuthenticatedUser): Promise<{
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
