import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AttendanceComponent } from './features/attendance/attendance.component';
import { AcademicsComponent } from './features/academics/academics.component';
import { HomeworkComponent } from './features/homework/homework.component';
import { ExamsComponent } from './features/exams/exams.component';
import { CommunicationComponent } from './features/communication/communication.component';
import { ComplaintsComponent } from './features/complaints/complaints.component';
import { MyClassComponent } from './features/my-class/my-class.component';
import { TimetableComponent } from './features/timetable/timetable.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'my-class', component: MyClassComponent },
      { path: 'timetable', component: TimetableComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'academics', component: AcademicsComponent },
      { path: 'homework', component: HomeworkComponent },
      { path: 'exams', component: ExamsComponent },
      { path: 'communication', component: CommunicationComponent },
      { path: 'complaints', component: ComplaintsComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
