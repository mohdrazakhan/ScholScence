import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequireService } from '../../common/decorators/auth-metadata.decorator';

@ApiTags('Homework')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequireService('HOMEWORK')
@Controller('homework')
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  @ApiOperation({ summary: 'Create and assign homework for a section & subject' })
  @ApiResponse({ status: 201, description: 'Homework published to section diary' })
  create(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHomeworkDto,
  ) {
    return this.homeworkService.createHomework(schoolId, user.userId, dto);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all homework assignments for a section' })
  @ApiParam({ name: 'sectionId', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Section homework feed retrieved' })
  getSectionHomework(@Param('sectionId') sectionId: string) {
    return this.homeworkService.getSectionHomework(sectionId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get homework feed for a student (Parent/Student view)' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student homework list retrieved' })
  getStudentHomework(@Param('studentId') studentId: string) {
    return this.homeworkService.getStudentHomework(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get homework details by ID' })
  @ApiParam({ name: 'id', description: 'Homework UUID' })
  @ApiResponse({ status: 200, description: 'Homework assignment details returned' })
  getHomeworkById(@Param('id') id: string) {
    return this.homeworkService.getHomeworkById(id);
  }
}
