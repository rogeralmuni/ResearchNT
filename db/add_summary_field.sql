-- Add summary field to startups table
ALTER TABLE startups ADD COLUMN IF NOT EXISTS summary text;

-- Add pending_tasks field to startups table
ALTER TABLE startups ADD COLUMN IF NOT EXISTS pending_tasks text;

-- Add comments to explain the fields
COMMENT ON COLUMN startups.summary IS 'Resumen ejecutivo generado automáticamente por IA';
COMMENT ON COLUMN startups.pending_tasks IS 'Documentos, tareas pendientes y puntos por clarificar';