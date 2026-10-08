import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './public/public-layout.component';
import { HomeComponent } from './public/home.component';
import { FeaturesComponent } from './public/features.component';
import { PricingComponent } from './public/pricing.component';
import { AboutComponent } from './public/about.component';
import { ContactComponent } from './public/contact.component';
import { BlogListComponent } from './public/blog/blog-list.component';
import { BlogPostComponent } from './public/blog/blog-post.component';
import { LegalPageComponent } from './public/legal/legal-page.component';
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
import { authGuard, authChildGuard, publicSubdomainGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Authentication route
  { path: 'login', component: LoginComponent },

  // Public Multipage Website
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [publicSubdomainGuard],
    canActivateChild: [publicSubdomainGuard],
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'home', redirectTo: '', pathMatch: 'full' },
      { path: 'features', component: FeaturesComponent },
      { path: 'product', redirectTo: 'features', pathMatch: 'full' },
      { path: 'pricing', component: PricingComponent },
      { path: 'about', component: AboutComponent },
      { path: 'about-us', redirectTo: 'about', pathMatch: 'full' },
      { path: 'contact', component: ContactComponent },
      { path: 'contact-us', redirectTo: 'contact', pathMatch: 'full' },
      { path: 'book-demo', redirectTo: 'contact', pathMatch: 'full' },
      { path: 'blog', component: BlogListComponent },
      { path: 'blog/:slug', component: BlogPostComponent },
      { path: 'legal/:doc', component: LegalPageComponent },
    ],
  },

  // Authenticated Portal Direct Routes
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'super-admin', component: SuperAdminComponent },
      { path: 'subscription', component: SubscriptionComponent },
      { path: 'my-class', component: MyClassComponent },
      { path: 'timetable', component: TimetableComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'academics', component: AcademicsComponent },
      { path: 'academics/student/:id', component: StudentDetailComponent },
      { path: 'students/:id', component: StudentDetailComponent },
      { path: 'homework', component: HomeworkComponent },
      { path: 'exams', component: ExamsComponent },
      { path: 'communication', component: CommunicationComponent },
      { path: 'complaints', component: ComplaintsComponent },
    ],
  },

  // Fallback route to home page
  { path: '**', redirectTo: '' },
];
