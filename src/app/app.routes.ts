import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { CertificationsComponent } from './pages/certifications/certifications.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { KnowledgeAreasComponent } from './pages/admin/knowledge-areas/knowledge-areas.component';
import { ContentsComponent } from './pages/admin/contents/contents.component';
import { CourseBuilderComponent } from './pages/admin/courses/course-builder/course-builder.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'courses', component: CoursesComponent },
  { path: 'certifications', component: CertificationsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'admin/knowledge-areas', component: KnowledgeAreasComponent },
  { path: 'admin/contents', component: ContentsComponent },
  { path: 'admin/course-builder', component: CourseBuilderComponent }
];