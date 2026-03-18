import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { from, map, Observable, shareReplay, timer } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private supabase = inject(SupabaseService).client;
    private auth = inject(AuthService);

    // Caching mechanism: Update every 5 minutes (300,000 ms)
    private CACHE_TIME = 300000;
    private dashboardCache$: Observable<any> | null = null;

    async logReportExport(reportName: string, action: 'VIEW_REPORT' | 'EXPORT_PDF' | 'EXPORT_EXCEL', justification?: string, filters?: any) {
        const profile = this.auth.getLoggedProfile();

        try {
            await this.supabase.from('report_audit_logs').insert({
                user_id: profile?.id || null,
                action: action,
                report_name: reportName,
                justification: justification || null,
                filters: filters || null
            });
        } catch (error) {
            console.error('Failed to log report action:', error);
        }
    }

    getDashboardMetrics(): Observable<any> {
        return from(this.fetchDashboardData()).pipe(
            shareReplay(1)
        );
    }

    private async fetchDashboardData() {
        // 1. Total de Alunos
        const { count: totalAlunos } = await this.supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('perfil', 'ALUNO');

        // 2. Nota Média Geral
        const { data: snapshots } = await this.supabase
            .from('assessment_snapshots')
            .select('nota_obtida');

        const notaMedia = snapshots && snapshots.length > 0
            ? snapshots.reduce((acc, s) => acc + (Number(s.nota_obtida) || 0), 0) / snapshots.length
            : 0;

        // 3. Taxa de Conclusão (Média de progresso nos conteúdos)
        const { data: progress } = await this.supabase
            .from('student_progress')
            .select('porcentagem_concluida');

        const taxaConclusao = progress && progress.length > 0
            ? progress.reduce((acc, p) => acc + (Number(p.porcentagem_concluida) || 0), 0) / progress.length
            : 0;

        // 4. Engajamento (Alunos ativos nos últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: activeLogs } = await this.supabase
            .from('access_logs')
            .select('id_usuario', { count: 'exact', head: false })
            .gt('data_inicio', thirtyDaysAgo.toISOString());

        const uniqueActiveUsers = new Set(activeLogs?.map(l => l.id_usuario)).size;
        const engajamento = totalAlunos && totalAlunos > 0
            ? (uniqueActiveUsers / totalAlunos) * 100
            : 0;

        return {
            kpis: {
                totalAlunos: totalAlunos || 0,
                taxaConclusao: Math.round(taxaConclusao),
                notaMedia: Number(notaMedia.toFixed(1)),
                engajamento: Number(engajamento.toFixed(1))
            }
        };
    }

    getPerformanceReportData(): Observable<any[]> {
        return from(this.fetchPerformanceReportData());
    }

    private async fetchPerformanceReportData() {
        // Fetch students and join with progress/assessments
        // In a complex app, we'd use a postgres view for this
        const { data: students, error } = await this.supabase
            .from('profiles')
            .select(`
                id,
                nome,
                codigo,
                student_progress(porcentagem_concluida),
                assessment_snapshots(nota_obtida, status_aprovacao)
            `)
            .eq('perfil', 'ALUNO');

        if (error) {
            console.error('Error fetching performance data:', error);
            return [];
        }

        return (students || []).map(s => {
            const progressArr = s.student_progress as any[] || [];
            const avgProgress = progressArr.length > 0
                ? progressArr.reduce((acc, p) => acc + Number(p.porcentagem_concluida), 0) / progressArr.length
                : 0;

            const assessments = s.assessment_snapshots as any[] || [];
            const avgGrade = assessments.length > 0
                ? assessments.reduce((acc, a) => acc + Number(a.nota_obtida), 0) / assessments.length
                : 0;

            const approvedCount = assessments.filter(a => a.status_aprovacao).length;

            return {
                nome: s.nome,
                matricula: s.codigo || 'N/A',
                curso: 'Ver Turmas', // Could be expanded to join classes
                media: avgGrade.toFixed(1),
                av_realizadas: assessments.length,
                av_aprovadas: approvedCount,
                status: avgProgress >= 100 ? 'Concluído' : (avgProgress > 0 ? 'Em Andamento' : 'Não Iniciado'),
                progresso: Math.round(avgProgress) + '%'
            };
        });
    }

    getAccessLogsData(): Observable<any[]> {
        return from(this.fetchAccessLogs());
    }

    private async fetchAccessLogs() {
        const { data: logs, error } = await this.supabase
            .from('access_logs')
            .select(`
                id,
                data_inicio,
                data_fim,
                tipo_entidade,
                id_entidade,
                metadata,
                profiles(nome, perfil)
            `)
            .order('data_inicio', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching access logs:', error);
            return [];
        }

        return (logs || []).map(l => {
            const start = l.data_inicio ? new Date(l.data_inicio) : null;
            const end = l.data_fim ? new Date(l.data_fim) : null;

            let duration = 'Em andamento';
            if (start && end) {
                const diff = (end.getTime() - start.getTime()) / 1000;
                const h = Math.floor(diff / 3600).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
                const s = Math.floor(diff % 60).toString().padStart(2, '0');
                duration = `${h}:${m}:${s}`;
            }

            const profile = l.profiles as any;
            const userAgent = l.metadata?.['User-Agent'] || '';
            const device = userAgent.includes('Mobi') || userAgent.includes('Android') ? 'Mobile' : 'Desktop';

            return {
                nome: profile?.nome || 'Anônimo',
                perfil: profile?.perfil || 'N/A',
                inicio: start ? start.toLocaleString('pt-BR') : 'N/A',
                fim: end ? end.toLocaleString('pt-BR') : '-',
                duracao: duration,
                conteudo: l.tipo_entidade || 'N/A',
                dispositivo: l.metadata?.['Device'] || device
            };
        });
    }

    getContentAccessedData(): Observable<any[]> {
        return from(this.fetchContentAccessed());
    }

    private async fetchContentAccessed() {
        const { data: logs, error } = await this.supabase
            .from('access_logs')
            .select(`
                id,
                data_inicio,
                data_fim,
                metadata,
                profiles(nome),
                contents(titulo_tema)
            `)
            .eq('tipo_entidade', 'CONTENT')
            .order('data_inicio', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching content logs:', error);
            return [];
        }

        return (logs || []).map(l => {
            const start = l.data_inicio ? new Date(l.data_inicio) : null;
            const end = l.data_fim ? new Date(l.data_fim) : null;

            let duration = '-';
            if (start && end) {
                const diff = (end.getTime() - start.getTime()) / 1000;
                const m = Math.floor(diff / 60);
                duration = m + 'm';
            }

            const profile = l.profiles as any;
            const content = l.contents as any;

            return {
                nome: profile?.nome || 'Anônimo',
                curso: 'Geral', // Simplified
                modulo: 'N/A', // Simplified
                conteudo: content?.titulo_tema || 'N/A',
                data: start ? start.toLocaleDateString('pt-BR') : 'N/A',
                tempo: duration,
                status: end ? 'Concluído' : 'Visualizando',
                conclusao: end ? '100%' : '50%'
            };
        });
    }

    getRetakeIndicatorsData(): Observable<any[]> {
        return from(this.fetchRetakeIndicators());
    }

    private async fetchRetakeIndicators() {
        const { data: failedSnapshots, error } = await this.supabase
            .from('assessment_snapshots')
            .select(`
                id,
                nota_obtida,
                numero_tentativa,
                data_aplicacao,
                profiles(nome),
                assessments(nome)
            `)
            .eq('status_aprovacao', false)
            .order('data_aplicacao', { ascending: false });

        if (error) {
            console.error('Error fetching retake indicators:', error);
            return [];
        }

        return (failedSnapshots || []).map(s => {
            const profile = s.profiles as any;
            const assessment = s.assessments as any;
            const applyDate = new Date(s.data_aplicacao);
            const diffDays = Math.floor((new Date().getTime() - applyDate.getTime()) / (1000 * 3600 * 24));

            return {
                nome: profile?.nome || 'Anônimo',
                curso: assessment?.nome || 'N/A',
                indicador: 'Reprovou',
                area: 'Ver Detalhes',
                nota: `${Number(s.nota_obtida).toFixed(1)} / 7.0`,
                tentativas: s.numero_tentativa || 1,
                dias_inativo: diffDays,
                acao: s.numero_tentativa && s.numero_tentativa > 3 ? 'Bloqueio Definitivo' : 'Refazer Avaliação'
            };
        });
    }

    // Personalization: Save favorite filters
    async saveFavoriteFilter(reportName: string, filterName: string, config: any) {
        const profile = this.auth.getLoggedProfile();
        if (!profile) return;

        console.log('Saving filter:', { user_id: profile.id, reportName, filterName, config });
    }
}
