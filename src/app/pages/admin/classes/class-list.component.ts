import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ClassService, Class } from '../../../core/services/class.service';
import { CourseService } from '../../../core/services/course.service';
import { ProfileService } from '../../../core/services/profile.service';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { Course } from '../../../core/models/course.model';
import { Profile } from '../../../core/models/profile.model';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DataTableComponent, UiModalComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Gestão de Turmas</h1>
          <p>Gerencie as turmas, professores e alunos vinculados.</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <lucide-icon name="Plus" size="18"></lucide-icon>
          Nova Turma
        </button>
      </header>

      <app-data-table 
        [title]="'Turmas Ativas'"
        [columns]="columns"
        [data]="classes"
        (edit)="openModal($event)"
        (delete)="confirmDelete($event)">
      </app-data-table>

<<<<<<< HEAD
      <app-ui-modal [title]="editingClass ? 'Editar Turma' : 'Nova Turma'" [(isOpen)]="isModalOpen">
=======
      <app-ui-modal title="Confirmar Exclusão" [(isOpen)]="isDeleteModalOpen" width="450px">
        <div class="modal-body" *ngIf="classToDelete">
          <p>Tem certeza que deseja excluir a turma <strong>{{ classToDelete.nome_turma }}</strong>?</p>
          <p style="font-size: 0.85rem; color: var(--danger); margin-top: 10px;">Esta ação não poderá ser desfeita e removerá todos os vínculos com alunos e cursos.</p>
          <div class="form-actions" style="margin-top: 2rem;">
            <button type="button" class="btn-secondary" (click)="cancelDelete()">Cancelar</button>
            <button type="button" class="btn-danger" (click)="executeDelete()">Sim, Excluir Turma</button>
          </div>
        </div>
      </app-ui-modal>

      <app-ui-modal [title]="editingClass ? 'Editar Turma' : 'Nova Turma'" [(isOpen)]="isModalOpen" width="620px">
>>>>>>> c32597f (ajuste do delete)
        <form (submit)="saveClass($event)" class="admin-form" id="classForm">
          <div class="form-alert form-alert-error" *ngIf="showError">
            <lucide-icon name="AlertCircle" size="18"></lucide-icon>
            Preencha todos os campos obrigatórios (*) para continuar.
          </div>
          <div class="form-group">
            <label>Nome da Turma <span class="required-star">*</span></label>
            <input type="text" [(ngModel)]="classForm.nome_turma" name="nome_turma" required 
                   [class.invalid-input]="showError && !classForm.nome_turma"
                   placeholder="Ex: Turma A - 2024">
            <small class="error-hint" *ngIf="showError && !classForm.nome_turma">O nome da turma é obrigatório.</small>
          </div>
          
          <div class="form-group" *ngIf="!editingClass">
            <label>Curso Inicial <span class="required-star">*</span></label>
            <select [(ngModel)]="classForm.id_curso" name="id_curso" required 
                    [class.invalid-input]="showError && !classForm.id_curso">
              <option [ngValue]="null">Selecione um curso...</option>
              <option *ngFor="let c of courses" [value]="c.id">{{ c.titulo }}</option>
            </select>
            <small class="error-hint" *ngIf="showError && !classForm.id_curso">O curso é obrigatório.</small>
          </div>

          <!-- Multiple courses section -->
          <div class="courses-management">
            <label>Cursos da Turma</label>
            <div class="add-course-controls">
              <select [(ngModel)]="selectedCourseToAdd" name="selectedCourseToAdd" class="course-select">
                <option [ngValue]="null">Adicionar curso...</option>
                <option *ngFor="let c of availableCoursesToLink" [value]="c.id">{{ c.titulo }}</option>
              </select>
              <button type="button" class="btn-primary btn-sm" (click)="addCourseToClass()" [disabled]="!selectedCourseToAdd || isAddingCourse">
                <lucide-icon name="Plus" size="16"></lucide-icon>
              </button>
            </div>
            
            <div class="linked-courses-list">
              <div class="linked-course-item" *ngFor="let cc of classCourses">
                <span>{{ cc.courses?.titulo }}</span>
                <button type="button" class="btn-remove" (click)="removeCourseFromClass(cc.id_curso)" title="Remover Curso">
                  <lucide-icon name="X" size="14"></lucide-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Professor Responsável</label>
            <select [(ngModel)]="classForm.id_professor" name="id_professor">
              <option [ngValue]="null">Selecione um professor...</option>
              <option *ngFor="let p of professors" [value]="p.id">{{ p.nome }}</option>
            </select>
          </div>
        </form>

        <!-- Students section -->
        <div class="students-section">
          <h3>Alunos Vinculados</h3>
          
          <div class="add-student-controls">
            <select [(ngModel)]="selectedStudentToAdd" class="student-select">
              <option [ngValue]="null">Selecione um aluno para adicionar...</option>
              <option *ngFor="let s of availableStudents" [value]="s.id">{{ s.nome }} ({{ s.email }})</option>
            </select>
            <button class="btn-primary btn-sm" (click)="addStudent()" [disabled]="!selectedStudentToAdd || isAddingStudent">
              <lucide-icon name="Plus" size="16"></lucide-icon> Adicionar
            </button>
          </div>

          <div class="students-list">
            <div class="student-item" *ngFor="let cs of classStudents">
              <div class="student-info">
                <span class="student-name">{{ cs.profiles?.nome }}</span>
                <span class="student-email">{{ cs.profiles?.email }}</span>
              </div>
              <button class="btn-remove" (click)="removeStudent(cs.id_aluno)" title="Remover Aluno">
                <lucide-icon name="Trash" size="16"></lucide-icon>
              </button>
            </div>
            <div class="empty-state" *ngIf="classStudents.length === 0">
              Nenhum aluno vinculado a esta turma.
            </div>
          </div>
        </div>

        <div class="form-actions" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
          <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
          <button type="submit" form="classForm" class="btn-primary">Salvar Turma</button>
        </div>
      </app-ui-modal>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; border: none; cursor: pointer; white-space: nowrap; }
    .btn-secondary { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; }

    .admin-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .form-group input, .form-group select { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); width: 100%; box-sizing: border-box; }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; }

    /* Courses management */
    .courses-management { display: flex; flex-direction: column; gap: 0.5rem; }
    .courses-management > label { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .add-course-controls { display: flex; gap: 0.5rem; align-items: center; }
    .course-select { flex: 1; min-width: 0; padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; }
    .linked-courses-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; min-height: 28px; }
    .linked-course-item { display: flex; align-items: center; gap: 6px; background: rgba(139,92,246,0.12); color: var(--primary); padding: 4px 10px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(139,92,246,0.25); }

    /* Students section */
    .students-section { margin-top: 1.5rem; border-top: 2px dashed var(--border); padding-top: 1.5rem; }
    .students-section h3 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-main); }

    .add-student-controls { display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; }
    .student-select { flex: 1; min-width: 0; padding: 0.7rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; }
    .btn-sm { padding: 0.6rem 1rem; font-size: 0.875rem; flex-shrink: 0; min-width: 100px; justify-content: center; }

    .students-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 260px; overflow-y: auto; padding-right: 0.25rem; }
    .student-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: 8px; }
<<<<<<< HEAD
    .student-info { display: flex; flex-direction: column; }
    .student-name { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
    .student-email { font-size: 0.8rem; color: var(--text-muted); }
    .btn-remove { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; }
    .btn-remove:hover { background: rgba(239, 68, 68, 0.1); }
    
    .empty-state { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border); }
=======
    .student-info { display: flex; flex-direction: column; min-width: 0; }
    .student-name { font-weight: 600; font-size: 0.9rem; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .student-email { font-size: 0.78rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-remove { background: none; border: none; color: #ef4444; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; flex-shrink: 0; }
    .btn-remove:hover { background: rgba(239,68,68,0.12); }

    .empty-state { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.875rem; background: var(--bg-main); border-radius: 8px; border: 1px dashed var(--border); }

    .btn-danger { background: var(--danger); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-danger:hover { opacity: 0.9; }

    /* Error states */
    .form-alert { display: flex; align-items: center; gap: 8px; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; }
    .form-alert-error { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
    .invalid-input { border-color: #ef4444 !important; }
    .error-hint { font-size: 0.78rem; color: #ef4444; }
    .required-star { color: #ef4444; }
>>>>>>> c32597f (ajuste do delete)
  `]
})
export class ClassListComponent implements OnInit {
  private classService = inject(ClassService);
  private courseService = inject(CourseService);
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);

  classes: any[] = [];
  courses: Course[] = [];
  professors: Profile[] = [];
  allStudents: Profile[] = [];

  // Course management state
  classCourses: any[] = [];
  availableCoursesToLink: Course[] = [];
  selectedCourseToAdd: string | null = null;
  isAddingCourse = false;

  // Student management state
  classStudents: any[] = [];
  availableStudents: Profile[] = [];
  selectedStudentToAdd: string | null = null;
  isAddingStudent = false;

  isModalOpen = false;
  editingClass: Class | null = null;
  classForm: Partial<Class> = {
    nome_turma: '',
    id_curso: null,
    id_professor: null
  };
  showError = false;

  isDeleteModalOpen = false;
  classToDelete: any = null;

  columns: TableColumn[] = [
    { key: 'nome_turma', label: 'Nome da Turma' },
    { key: 'courses_list', label: 'Cursos' },
    { key: 'profiles_nome', label: 'Professor' },
    { key: 'created_at', label: 'Data de Início' }
  ];

  ngOnInit() {
    this.refresh();
    this.courseService.getCourses().subscribe(data => this.courses = data);
    this.profileService.getProfiles().subscribe(data => {
      this.professors = data.filter(p => p.perfil === 'PROFESSOR' || p.perfil === 'ADMIN');
      this.allStudents = data.filter(p => p.perfil === 'ALUNO');
    });
  }

  refresh() {
    this.classService.getClasses().subscribe(data => {
      this.classes = data.map(c => ({
        ...c,
        courses_list: c.class_courses?.map((cc: any) => cc.courses?.titulo).filter(Boolean).join(', ') || 'Nenhum',
        profiles_nome: c.profiles?.nome || 'N/A'
      }));
    });
  }

  openModal(clazz?: Class) {
    this.showError = false;
    this.selectedStudentToAdd = null;
    this.selectedCourseToAdd = null;
    if (clazz) {
      this.editingClass = clazz;
      this.classForm = { ...clazz };
      this.classCourses = clazz.class_courses || [];
      this.updateAvailableCourses();
      this.loadClassStudents(clazz.id);
    } else {
      this.editingClass = null;
      this.classForm = {
        nome_turma: '',
        id_curso: null, // Initial course for creation
        id_professor: null
      };
      this.classCourses = [];
      this.classStudents = [];
      this.updateAvailableCourses();
      this.updateAvailableStudents();
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.showError = false;
  }

  async saveClass(event: Event) {
    event.preventDefault();
    this.showError = false;

    if (!this.classForm.nome_turma || (!this.editingClass && !this.classForm.id_curso)) {
      this.showError = true;
      return;
    }

    const payload = {
      nome_turma: this.classForm.nome_turma,
      id_professor: this.classForm.id_professor
    };

    try {
      if (this.editingClass) {
        const response = await this.classService.updateClass(this.editingClass.id, payload);
        if (response.error) throw response.error;
        this.toastService.success('Turma atualizada com sucesso!');
      } else {
        // 1. Create class
        const { data: newClass, error } = await this.classService.createClass(payload);
        if (error) throw error;

        // 2. Link initial course and other local courses
        if (newClass) {
          if (this.classForm.id_curso) {
            await this.classService.addCourseToClass(newClass.id, this.classForm.id_curso);
          }
          for (const cc of this.classCourses) {
            if (cc.id_curso !== this.classForm.id_curso) {
              await this.classService.addCourseToClass(newClass.id, cc.id_curso);
            }
          }
          // 3. Link students
          for (const cs of this.classStudents) {
            await this.classService.addStudentToClass(newClass.id, cs.id_aluno);
          }
        }
        this.toastService.success('Turma criada com sucesso!');
      }
      this.closeModal();
      this.refresh();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      this.toastService.error('Erro ao salvar turma: ' + (error.message || 'Erro desconhecido'));
    }
  }

  updateAvailableCourses() {
    const linkedIds = new Set(this.classCourses.map(cc => cc.id_curso));
    this.availableCoursesToLink = this.courses.filter(c => !linkedIds.has(c.id));
  }

  async addCourseToClass() {
    if (!this.selectedCourseToAdd) return;

    const course = this.courses.find(c => c.id === this.selectedCourseToAdd);
    if (!course) return;

    if (this.editingClass) {
      this.isAddingCourse = true;
      try {
        const { error } = await this.classService.addCourseToClass(this.editingClass.id, this.selectedCourseToAdd);
        if (error) throw error;
        this.toastService.success('Curso adicionado com sucesso!');
        this.refresh();
      } catch (e: any) {
        this.toastService.error('Erro ao adicionar curso.');
        return;
      } finally {
        this.isAddingCourse = false;
      }
    }

    // Add to local list anyway
    if (!this.classCourses.some(cc => cc.id_curso === this.selectedCourseToAdd)) {
      this.classCourses.push({ id_curso: this.selectedCourseToAdd, courses: { titulo: course.titulo } });
    }
    this.selectedCourseToAdd = null;
    this.updateAvailableCourses();
  }

  async removeCourseFromClass(courseId: string) {
    if (this.editingClass) {
      try {
        const { error } = await this.classService.removeCourseFromClass(this.editingClass.id, courseId);
        if (error) throw error;
        this.toastService.success('Curso removido da turma.');
        this.refresh();
      } catch (e: any) {
        this.toastService.error('Erro ao remover curso.');
        return;
      }
    }

    // Remove from local list
    this.classCourses = this.classCourses.filter(cc => cc.id_curso !== courseId);
    this.updateAvailableCourses();
  }

  confirmDelete(clazz: Class) {
    this.classToDelete = clazz;
    this.isDeleteModalOpen = true;
  }

  cancelDelete() {
    this.isDeleteModalOpen = false;
    this.classToDelete = null;
  }

  async executeDelete() {
    if (!this.classToDelete) return;

    try {
      const { error } = await this.classService.deleteClass(this.classToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir: ' + (error as any).message);
      } else {
        this.toastService.success('Turma excluída com sucesso!');
        this.refresh();
      }
    } catch (error: any) {
      console.error('Erro ao excluir turma:', error);
      this.toastService.error('Erro ao excluir turma.');
    } finally {
      this.cancelDelete();
    }
  }

  loadClassStudents(classId: string) {
    this.classService.getClassStudents(classId).subscribe(data => {
      this.classStudents = data;
      this.updateAvailableStudents();
    });
  }

  updateAvailableStudents() {
    const enrolledIds = new Set(this.classStudents.map(cs => cs.id_aluno));
    this.availableStudents = this.allStudents.filter(s => !enrolledIds.has(s.id));
  }

  async addStudent() {
    if (!this.selectedStudentToAdd) return;

    const student = this.allStudents.find(s => s.id === this.selectedStudentToAdd);
    if (!student) return;

    if (this.editingClass) {
      this.isAddingStudent = true;
      try {
        const { error } = await this.classService.addStudentToClass(this.editingClass.id, this.selectedStudentToAdd);
        if (error) throw error;
        this.toastService.success('Aluno vinculado com sucesso!');
        this.loadClassStudents(this.editingClass.id);
      } catch (e) {
        this.toastService.error('Erro ao vincular aluno.');
      } finally {
        this.isAddingStudent = false;
      }
    } else {
      // Local state for creation
      if (!this.classStudents.some(cs => cs.id_aluno === this.selectedStudentToAdd)) {
        this.classStudents.push({
          id_aluno: this.selectedStudentToAdd,
          profiles: { nome: student.nome, email: student.email }
        });
      }
      this.selectedStudentToAdd = null;
      this.updateAvailableStudents();
    }
  }

  async removeStudent(studentId: string) {
    if (this.editingClass) {
      try {
        const { error } = await this.classService.removeStudentFromClass(this.editingClass.id, studentId);
        if (error) throw error;
        this.toastService.success('Aluno removido da turma.');
        this.loadClassStudents(this.editingClass.id);
      } catch (e) {
        this.toastService.error('Erro ao remover aluno.');
      }
    } else {
      // Local state for creation
      this.classStudents = this.classStudents.filter(cs => cs.id_aluno !== studentId);
      this.updateAvailableStudents();
    }
  }
}
