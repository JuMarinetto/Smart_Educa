-- Função para buscar engajamento mensal (últimos 6 meses)
CREATE OR REPLACE FUNCTION get_monthly_engagement()
RETURNS TABLE (data integer) AS $$
BEGIN
    RETURN QUERY 
    WITH months AS (
        SELECT generate_series(
            date_trunc('month', current_date) - interval '5 months',
            date_trunc('month', current_date),
            interval '1 month'
        ) AS m
    )
    SELECT 
        COALESCE(count(DISTINCT al.id_aluno)::integer, 0)
    FROM months
    LEFT JOIN access_logs al ON date_trunc('month', al.created_at) = months.m
    GROUP BY months.m
    ORDER BY months.m;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular tempo médio por módulo (Minutos)
CREATE OR REPLACE FUNCTION get_average_time_per_module(p_course_id uuid DEFAULT NULL)
RETURNS TABLE (module_name text, average_minutes float) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.titulo as module_name,
        AVG(EXTRACT(EPOCH FROM (al.logout_at - al.created_at))/60)::float as average_minutes
    FROM modules m
    JOIN lessons l ON l.id_modulo = m.id
    JOIN access_logs al ON al.path LIKE '%' || l.id || '%' -- Heurística: log contém ID da aula no path
    WHERE (p_course_id IS NULL OR m.id_curso = p_course_id)
    AND al.logout_at IS NOT NULL
    GROUP BY m.id, m.titulo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
