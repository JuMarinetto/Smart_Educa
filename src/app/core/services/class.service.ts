import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, map } from 'rxjs';

export interface Class {
    id: string;
    nome_turma: string;
    id_professor: string | null;
    id_curso: string | null; // Keep for backward compatibility/migration
    created_at: string;
    class_courses?: any[]; // Array of linked courses
}

@Injectable({
    providedIn: 'root'
})
export class ClassService {
    private supabase = inject(SupabaseService).client;

    getClasses() {
        return from(
            this.supabase.from('classes').select(`
                *,
                class_courses (
                    id,
                    id_curso,
                    courses (titulo)
                ),
                profiles (nome)
            `)
        ).pipe(
            map(res => {
                if (res.error) {
                    console.error('CRITICAL: Error fetching classes:', res.error);
                    return [];
                }
                return (res.data as any[]) || [];
            })
        );
    }

    async createClass(clazz: Partial<Class>) {
        return await this.supabase.from('classes').insert(clazz).select().single();
    }

    async updateClass(id: string, clazz: Partial<Class>) {
        return await this.supabase.from('classes').update(clazz).eq('id', id);
    }

    async deleteClass(id: string) {
        // 1. Remove linked entities first
        await this.supabase.from('class_courses').delete().eq('id_turma', id);
        await this.supabase.from('class_students').delete().eq('id_turma', id);

        // 2. Remove the class itself
        return await this.supabase.from('classes').delete().eq('id', id);
    }

    async addStudentToClass(classId: string, studentId: string) {
        return await this.supabase.from('class_students').insert({ id_turma: classId, id_aluno: studentId });
    }

    async removeStudentFromClass(classId: string, studentId: string) {
        return await this.supabase.from('class_students').delete().eq('id_turma', classId).eq('id_aluno', studentId);
    }

    getClassStudents(classId: string) {
        return from(
            this.supabase.from('class_students').select(`
                id,
                id_aluno,
                profiles (nome, email)
            `).eq('id_turma', classId)
        ).pipe(map(res => (res.data as any[]) || []));
    }

    async addCourseToClass(classId: string, courseId: string) {
        return await this.supabase.from('class_courses').insert({ id_turma: classId, id_curso: courseId });
    }

    async removeCourseFromClass(classId: string, courseId: string) {
        return await this.supabase.from('class_courses').delete().eq('id_turma', classId).eq('id_curso', courseId);
    }
}
