-- Enable extension for hierarchical paths (CNPq mapping)
CREATE EXTENSION IF NOT EXISTS ltree;

-- Epic 9: Security and Audit Table for Reports
CREATE TABLE IF NOT EXISTS public.report_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- e.g., 'VIEW_REPORT', 'EXPORT_PDF', 'EXPORT_EXCEL'
    report_name VARCHAR(255) NOT NULL,
    filters JSONB, -- Record the exact filters used
    justification TEXT, -- Required for exports
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic RLS for the audit logs (Admin only)
ALTER TABLE public.report_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.report_audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.report_audit_logs 
FOR SELECT 
USING (
  (SELECT perfil FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- Anyone can insert an audit log (so standard users can log their actions)
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.report_audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.report_audit_logs
FOR INSERT
TO public
WITH CHECK (
  true
);


-- Epic 10: Hierarchical refactor - adding `path` to knowledge_areas if it doesn't already use ltree
ALTER TABLE public.knowledge_areas 
ADD COLUMN IF NOT EXISTS path ltree;

-- Create an index to speed up hierarchical queries
CREATE INDEX IF NOT EXISTS idx_knowledge_areas_path ON public.knowledge_areas USING GIST (path);

-- Example trigger function to auto-update path based on parent_id (assuming parent_id still exists for structural references)
CREATE OR REPLACE FUNCTION update_knowledge_area_path() RETURNS TRIGGER AS $$
DECLARE
    parent_path ltree;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = text2ltree(replace(NEW.id::text, '-', '_'));
    ELSE
        SELECT path INTO parent_path FROM public.knowledge_areas WHERE id = NEW.parent_id;
        NEW.path = parent_path || text2ltree(replace(NEW.id::text, '-', '_'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_knowledge_area_path ON public.knowledge_areas;
CREATE TRIGGER trg_knowledge_area_path
    BEFORE INSERT OR UPDATE OF parent_id
    ON public.knowledge_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_area_path();

-- Update existing rows (if any) to populate the ltree path from existing parent_ids
-- This needs a recursive CTE if we want to backfill existing data cleanly
WITH RECURSIVE area_tree AS (
    -- Base cases (Roots)
    SELECT id, parent_id, text2ltree(replace(id::text, '-', '_')) AS new_path
    FROM public.knowledge_areas
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive Step
    SELECT ka.id, ka.parent_id, at.new_path || text2ltree(replace(ka.id::text, '-', '_'))
    FROM public.knowledge_areas ka
    JOIN area_tree at ON ka.parent_id = at.id
)
UPDATE public.knowledge_areas ka
SET path = at.new_path
FROM area_tree at
WHERE ka.id = at.id
AND ka.path IS NULL;
