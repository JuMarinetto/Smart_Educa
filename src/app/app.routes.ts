import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { StudentLayoutComponent } from './layout/student-layout/student-layout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { adminGuard } from './core/guards/admin.guard';
import { studentGuard } from './core/guards/student.guard';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CertificationsComponent } from './pages/certifications/certifications.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ContentsComponent } from './pages/admin/contents/contents.component';
import { CourseBuilderComponent } from './pages/admin/courses/course-builder/course-builder.component';
import { CoursePlayerComponent } from './pages/courses/course-player/course-player.component';
import { AssessmentTakeComponent } from './pages/assessments/assessment-take/assessment-take.component';
import { ProfileListComponent } from './pages/admin/profiles/profile-list.component';
import { CourseListComponent } from './pages/admin/courses/course-list.component';
import { AssessmentListComponent } from './pages/admin/assessments/assessment-list.component';
import { ClassListComponent } from './pages/admin/classes/class-list.component';

import { AccessTimeReportComponent } from './pages/reports/access-time.component';
import { ContentAccessedReportComponent } from './pages/reports/content-accessed.component';
import { PerformanceReportComponent } from './pages/reports/performance.component';
import { RetakeIndicatorsReportComponent } from './pages/reports/retake-indicators.component';
import { FranchiseTrainingReportComponent } from './pages/reports/franchise-training.component';
import { StaffCapacityReportComponent } from './pages/reports/staff-capacity.component';

import { StudentDashboardComponent } from './pages/student/dashboard/student-dashboard.component';
import { StudentCatalogComponent } from './pages/student/catalog/student-catalog.component';
import { StudentMyCoursesComponent } from './pages/student/my-courses/student-my-courses.component';
import { StudentAssessmentsComponent } from './pages/student/assessments/student-assessments.component';
import { StudentCertificatesComponent } from './pages/student/certificates/student-certificates.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Auth Routes (No Sidebar)
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent }
    ]
  },

  // Admin / Professor Environment
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },

      // Módulo Administração
      { path: 'contents', component: ContentsComponent },
      { path: 'profiles', component: ProfileListComponent },
      { path: 'courses', component: CourseListComponent },
      { path: 'assessments', component: AssessmentListComponent },
      { path: 'classes', component: ClassListComponent },
      { path: 'course-builder', component: CourseBuilderComponent },

      // Cursos (Visão Admin/Professor - legado)
      { path: 'courses-view', component: CoursesComponent },
      { path: 'course-player/:id', component: CoursePlayerComponent },
      { path: 'assessment/:id', component: AssessmentTakeComponent },
      { path: 'certifications', component: CertificationsComponent },

      // Relatórios
      { path: 'reports/access-time', component: AccessTimeReportComponent },
      { path: 'reports/content-accessed', component: ContentAccessedReportComponent },
      { path: 'reports/performance', component: PerformanceReportComponent },
      { path: 'reports/retake-indicators', component: RetakeIndicatorsReportComponent },
      { path: 'reports/franchise-training', component: FranchiseTrainingReportComponent },
      { path: 'reports/staff-capacity', component: StaffCapacityReportComponent },

      // Configs
      { path: 'settings', component: SettingsComponent }
    ]
  },

  // Student Environment
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [studentGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'catalog', component: StudentCatalogComponent },
      { path: 'my-courses', component: StudentMyCoursesComponent },
      { path: 'assessments', component: StudentAssessmentsComponent },
      { path: 'certificates', component: StudentCertificatesComponent },
      { path: 'course-player/:id', component: CoursePlayerComponent },
      { path: 'assessment/:id', component: AssessmentTakeComponent }
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];