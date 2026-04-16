import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { CourseService } from '../../../core/services/course.service';
import { ProfileService } from '../../../core/services/profile.service';
import { Course } from '../../../core/models/course.model';
import { Profile } from '../../../core/models/profile.model';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule, DataTableComponent, UiModalComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Gestão de Cursos</h1>
          <p>Crie e gerencie os cursos e trilhas de aprendizagem.</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <lucide-icon name="Plus" size="18"></lucide-icon>
          Novo Curso
        </button>
      </header>

      <app-data-table 
        [title]="'Todos os Cursos'"
        [columns]="columns"
        [data]="courses"
        (edit)="openModal($event)"
        (delete)="deleteCourse($event)">
      </app-data-table>

      <app-ui-modal [title]="editingCourse ? 'Editar Metadados' : 'Novo Curso'" [(isOpen)]="isModalOpen">
        <form (submit)="saveCourse($event)" class="admin-form">
          <div class="form-alert form-alert-error" *ngIf="showError">
            <lucide-icon name="AlertCircle" size="18"></lucide-icon>
            Preencha todos os campos obrigatórios (*) para continuar.
          </div>
          <div class="form-group">
            <label>Título do Curso <span class="required-star">*</span></label>
            <input type="text" [(ngModel)]="courseForm.titulo" name="titulo" required 
                   [class.invalid-input]="showError && !courseForm.titulo"
                   placeholder="Ex: Formação em IA Aplicada">
            <small class="error-hint" *ngIf="showError && !courseForm.titulo">O título do curso é obrigatório.</small>
          </div>
          
          <div class="form-group">
            <label>Professor Responsável</label>
            <select [(ngModel)]="courseForm.id_professor" name="id_professor">
              <option [ngValue]="null">Selecione um professor...</option>
              <option *ngFor="let p of professors" [value]="p.id">{{ p.nome }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Status</label>
            <select [(ngModel)]="courseForm.status" name="status">
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

          <div class="builder-link-box">
            <p *ngIf="editingCourse">Para gerenciar as aulas, tópicos e materiais deste curso:</p>
            <p *ngIf="!editingCourse">Você poderá acessar o construtor após salvar ou clicando no botão abaixo.</p>
            <button type="button" class="btn-builder" (click)="goToBuilder()">
              <lucide-icon name="Layout" size="16"></lucide-icon>
              Abrir Construtor de Conteúdo
            </button>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar Curso</button>
          </div>
        </form>
      </app-ui-modal>

      <app-ui-modal title="Confirmar Exclusão" [(isOpen)]="isDeleteModalOpen" width="400px">
        <div class="delete-confirm">
          <p>Deseja realmente excluir o curso <strong>{{ courseToDelete?.titulo }}</strong>?</p>
          <p class="warning-text">Esta ação apagará todos os tópicos e certificados vinculados e não pode ser desfeita.</p>
          <div class="form-actions">
            <button class="btn-secondary" (click)="isDeleteModalOpen = false">Cancelar</button>
            <button class="btn-danger" (click)="confirmDelete()">Sim, Excluir</button>
          </div>
        </div>
      </app-ui-modal>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; border: none; cursor: pointer; }
    .btn-secondary { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; }
    .btn-danger { background: var(--danger); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
    
    .admin-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .form-group input, .form-group select { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); }
    
    .builder-link-box { background: rgba(37, 99, 235, 0.05); padding: 1.5rem; border-radius: 12px; border: 1px dashed var(--primary); text-align: center; }
    .builder-link-box p { font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-muted); }
    .btn-builder { background: white; border: 1px solid var(--primary); color: var(--primary); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 0 auto; font-weight: 600; }
    .btn-builder:hover { background: var(--primary); color: white; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .delete-confirm { text-align: center; }
    .delete-confirm p { margin-bottom: 1rem; color: var(--text-main); }
    .warning-text { font-size: 0.85rem; color: var(--danger) !important; font-weight: 500; }

  `]
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);
  private profileService = inject(ProfileService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  courses: Course[] = [];
  professors: Profile[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  editingCourse: Course | null = null;
  courseToDelete: Course | null = null;
  courseForm: Partial<Course> = {
    titulo: '',
    id_professor: null,
    status: 'Ativo'
  };
  showError = false;

  columns: TableColumn[] = [
    { key: 'titulo', label: 'Título', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'created_at', label: 'Data de Criação', type: 'date' }
  ];

  ngOnInit() {
    this.refresh();
    this.profileService.getProfiles().subscribe(data => {
      this.professors = data.filter(p => p.perfil === 'PROFESSOR' || p.perfil === 'ADMIN');
    });
  }

  refresh() {
    this.courseService.getCourses().subscribe(data => {
      this.courses = data;
    });
  }

  openModal(course?: Course) {
    this.showError = false;
    if (course) {
      this.editingCourse = course;
      this.courseForm = { ...course };
    } else {
      this.editingCourse = null;
      this.courseForm = {
        titulo: '',
        id_professor: null,
        status: 'Ativo'
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.showError = false;
  }

  async goToBuilder() {
    if (this.editingCourse) {
      this.router.navigate(['/admin/course-builder'], { queryParams: { id: this.editingCourse.id } });
    } else {
      if (!this.courseForm.titulo) {
        this.showError = true;
        this.toastService.warning('Informe o título do curso primeiro.');
        return;
      }

      const savedCourse = await this.performSave();
      if (savedCourse) {
        this.router.navigate(['/admin/course-builder'], { queryParams: { id: savedCourse.id } });
      }
    }
  }

  async saveCourse(event: Event) {
    event.preventDefault();
    const saved = await this.performSave();
    if (saved) {
      this.closeModal();
      this.refresh();
    }
  }

  private async performSave(): Promise<Course | null> {
    this.showError = false;

    if (!this.courseForm.titulo) {
      this.showError = true;
      return null;
    }

    const payload = {
      titulo: this.courseForm.titulo,
      id_professor: this.courseForm.id_professor,
      status: this.courseForm.status
    };

    try {
      const response = this.editingCourse
        ? await this.courseService.updateCourse(this.editingCourse.id, payload)
        : await this.courseService.createCourse(payload);

      if (response.error) {
        this.toastService.error('Erro ao salvar curso: ' + response.error.message);
        console.error(response.error);
        return null;
      } else {
        this.toastService.success(this.editingCourse ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!');
        return response.data;
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      this.toastService.error('Erro inesperado ao salvar curso.');
      return null;
    }
  }

  async deleteCourse(course: Course) {
    this.courseToDelete = course;
    this.isDeleteModalOpen = true;
  }

  async confirmDelete() {
    if (!this.courseToDelete) return;
    
    try {
      const { error } = await this.courseService.deleteCourse(this.courseToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir: ' + (error as any).message);
      } else {
        this.toastService.success('Curso excluído com sucesso!');
        this.isDeleteModalOpen = false;
        this.courseToDelete = null;
        this.refresh();
      }
    } catch (error: any) {
      console.error('Erro ao excluir curso:', error);
      this.toastService.error('Erro ao excluir curso.');
    }
  }
}
