import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Homework')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('homework')
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  @ApiOperation({ summary: 'Create and assign homework for a section & subject' })
  create(
    @CurrentTenant() schoolId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHomeworkDto,
  ) {
    return this.homeworkService.createHomework(schoolId, user.userId, dto);
  }

  @Get('section/:sectionId')
  @ApiOperation({ summary: 'Get all homework assignments for a section' })
  getSectionHomework(@Param('sectionId') sectionId: string) {
    return this.homeworkService.getSectionHomework(sectionId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get homework feed for a student (Parent/Student view)' })
  getStudentHomework(@Param('studentId') studentId: string) {
    return this.homeworkService.getStudentHomework(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get homework details by ID' })
  getHomeworkById(@Param('id') id: string) {
    return this.homeworkService.getHomeworkById(id);
  }
}
