-- Adicionar campos faltantes e ajustar estrutura para o novo design

-- Adicionar campo content para anotações (estilo Google Docs)
ALTER TABLE timeline_entries 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS is_task BOOLEAN DEFAULT FALSE;

-- Garantir que chapters tem todos os campos necessários
ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_timeline_entries_chapter ON timeline_entries(chapter_id);
CREATE INDEX IF NOT EXISTS idx_timeline_entries_adventure ON timeline_entries(adventure_id);
CREATE INDEX IF NOT EXISTS idx_character_mentions_entry ON character_mentions(timeline_entry_id);
CREATE INDEX IF NOT EXISTS idx_region_mentions_entry ON region_mentions(timeline_entry_id);
CREATE INDEX IF NOT EXISTS idx_npcs_adventure ON npcs(adventure_id);
CREATE INDEX IF NOT EXISTS idx_regions_adventure ON regions(adventure_id);
CREATE INDEX IF NOT EXISTS idx_tasks_adventure ON tasks(adventure_id);

-- Comentários para documentação
COMMENT ON COLUMN timeline_entries.content IS 'Conteúdo rico da anotação em formato HTML/Markdown';
COMMENT ON COLUMN timeline_entries.is_task IS 'Se true, esta entrada é uma tarefa da sidebar';
COMMENT ON COLUMN chapters.is_completed IS 'Se true, este capítulo está marcado como concluído';
