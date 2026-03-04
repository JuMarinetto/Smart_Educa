import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Course, Topic } from '../models/course.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private supabase = inject(SupabaseService).client;

  getCourses() {
    return from(
      this.supabase.from('courses').select('*').eq('status', 'ATIVO')
    ).pipe(map(res => res.data as Course[]));
  }

  getCourseStructure(courseId: string) {
    return from(
      this.supabase
        .from('topics')
        .select(`
          *,
          course_contents (
            *,
            contents (*)
          )
        `)
        .eq('id_curso', courseId)
        .order('nome_topico')
    ).pipe(map(res => res.data as any[]));
  }

  async enrollStudent(classId: string, studentId: string) {
    return await this.supabase
      .from('class_students')
      .insert({ id_turma: classId, id_aluno: studentId });
  }
}