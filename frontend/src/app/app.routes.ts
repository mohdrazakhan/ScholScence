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
import { SuperAdminComponent } from './features/super-admin/super-admin.component';
import { SubscriptionComponent } from './features/subscription/subscription.component';
import { StudentDetailComponent } from './features/academics/student-detail.component';
import { authGuard, authChildGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'super-admin', component: SuperAdminComponent, canActivate: [authGuard] },
      { path: 'subscription', component: SubscriptionComponent, canActivate: [authGuard] },
      { path: 'my-class', component: MyClassComponent, canActivate: [authGuard] },
      { path: 'timetable', component: TimetableComponent, canActivate: [authGuard] },
      { path: 'attendance', component: AttendanceComponent, canActivate: [authGuard] },
      { path: 'academics', component: AcademicsComponent, canActivate: [authGuard] },
      { path: 'academics/student/:id', component: StudentDetailComponent, canActivate: [authGuard] },
      { path: 'students/:id', component: StudentDetailComponent, canActivate: [authGuard] },
      { path: 'homework', component: HomeworkComponent, canActivate: [authGuard] },
      { path: 'exams', component: ExamsComponent, canActivate: [authGuard] },
      { path: 'communication', component: CommunicationComponent, canActivate: [authGuard] },
      { path: 'complaints', component: ComplaintsComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
