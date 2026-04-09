import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Course, Topic } from '../models/course.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  getCourses() {
    return from(
      this.supabase.from('courses').select('*').order('titulo')
    ).pipe(map(res => (res.data as Course[]) || []));
  }

  getStudentCourses(studentId: string) {
    return from(
      this.supabase
        .from('class_students')
        .select(`
          classes (
            id,
            class_courses (
              courses (*)
            )
          )
        `)
        .eq('id_aluno', studentId)
    ).pipe(
      map(res => {
        if (res.error) {
          console.error('CRITICAL: Error in getStudentCourses:', res.error);
          return [];
        }
        if (!res.data) return [];

        const coursesMap = new Map<string, Course>();
        res.data.forEach((cs: any) => {
          if (cs.classes && cs.classes.class_courses) {
            cs.classes.class_courses.forEach((cc: any) => {
              const course = cc.courses as Course;
              if (course && course.status === 'Ativo') {
                coursesMap.set(course.id, course);
              }
            });
          }
        });
        return Array.from(coursesMap.values());
      })
    );
  }

  getCourseStructure(courseId: string) {
    return from(
      this.supabase
        .from('topics')
        .select(`
          *,
          course_contents (
            *,
            contents (*),
            questions (
              *,
              alternatives (*)
            )
          )
        `)
        .eq('id_curso', courseId)
        .order('nome_topico')
    ).pipe(map(res => (res.data as any[]) || []));
  }

  async enrollStudent(classId: string, studentId: string) {
    return await this.supabase
      .from('class_students')
      .insert({ id_turma: classId, id_aluno: studentId });
  }

  getClassesForCourse(courseId: string) {
    return from(
      this.supabase
        .from('class_courses')
        .select('id_turma, classes(*)')
        .eq('id_curso', courseId)
    ).pipe(map(res => (res.data as any[]) || []));
  }

  async autoCreateClassForCourse(courseId: string, courseTitle: string): Promise<string | null> {
    try {
      // 1. Create a new turma
      const { data: newClass, error: classError } = await this.supabase
        .from('classes')
        .insert({ nome_turma: `Turma - ${courseTitle}` })
        .select()
        .single();

      if (classError || !newClass) {
        console.error('Error creating class:', classError);
        return null;
      }

      // 2. Link the turma to the course
      const { error: linkError } = await this.supabase
        .from('class_courses')
        .insert({ id_turma: newClass.id, id_curso: courseId });

      if (linkError) {
        console.error('Error linking course to class:', linkError);
        // Rollback: delete the class we just created
        await this.supabase.from('classes').delete().eq('id', newClass.id);
        return null;
      }

      return newClass.id;
    } catch (err) {
      console.error('Error in autoCreateClassForCourse:', err);
      return null;
    }
  }

  async createCourse(course: Partial<Course>) {
    return await this.supabase.from('courses').insert(course);
  }

  async updateCourse(id: string, course: Partial<Course>) {
    return await this.supabase.from('courses').update(course).eq('id', id);
  }

  async deleteCourse(id: string) {
    try {
      // 1. Limpar vínculos com turmas
      await this.supabase.from('class_courses').delete().eq('id_curso', id);
      
      // 2. Limpar certificados emitidos para este curso
      await this.supabase.from('certificates').delete().eq('id_curso', id);
      
      // 3. Limpar estrutura do roteiro (tópicos e itens vinculados)
      const { data: topics } = await this.supabase
        .from('topics')
        .select('id')
        .eq('id_curso', id);
        
      if (topics && topics.length > 0) {
        const topicIds = topics.map(t => t.id);
        // Primeiro deleta os registros de id_conteudo/id_questao vinculados aos tópicos
        await this.supabase.from('course_contents').delete().in('id_topico', topicIds);
        // Depois deleta os tópicos
        await this.supabase.from('topics').delete().eq('id_curso', id);
      }
      
      // 4. Finalmente, deletar o curso
      return await this.supabase.from('courses').delete().eq('id', id);
    } catch (error: any) {
      console.error('Erro ao deletar curso em cascata:', error);
      return { error: { message: error.message || 'Erro inesperado ao deletar curso' } };
    }
  }

  async saveCourseStructure(courseId: string, modules: { id?: string, nome: string, items?: any[], contents?: any[] }[]) {
    try {
      // 1. Limpar roteiro atual (tópicos e conteúdos vinculados)
      // Como o roteiro é flexível, deletamos tudo deste curso e reinserimos
      // Primeiro pegamos os IDs dos tópicos para limpar os conteúdos
      const { data: oldTopics } = await this.supabase
        .from('topics')
        .select('id')
        .eq('id_curso', courseId);

      if (oldTopics && oldTopics.length > 0) {
        const topicIds = oldTopics.map(t => t.id);
        await this.supabase.from('course_contents').delete().in('id_topico', topicIds);
        await this.supabase.from('topics').delete().eq('id_curso', courseId);
      }

      // 2. Inserir novos tópicos e seus conteúdos
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        
        // Criar o tópico
        const { data: newTopic, error: topicError } = await this.supabase
          .from('topics')
          .insert({
            id_curso: courseId,
            nome_topico: mod.nome,
            ordem: i + 1
          })
          .select()
          .single();

        if (topicError) throw topicError;

        // Inserir itens do tópico (conteúdos e questões)
        const items = mod.items || mod.contents || [];
        if (items.length > 0) {
          const itemsPayload = items.map((item: any, index: number) => {
            if (item.tipo === 'questao') {
              return {
                id_topico: newTopic.id,
                id_questao: item.question?.id || item.id,
                tipo: 'questao',
                ordem: index + 1
              };
            } else {
              return {
                id_topico: newTopic.id,
                id_conteudo: item.content?.id || item.id,
                tipo: 'conteudo',
                ordem: index + 1
              };
            }
          });

          const { error: contentError } = await this.supabase
            .from('course_contents')
            .insert(itemsPayload);

          if (contentError) throw contentError;
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error in saveCourseStructure:', error);
      return { error };
    }
  }
}