-- ============================================================
-- The Boyz : lien externe et image de couverture sur les plans
-- À lancer dans le SQL Editor de Supabase, après 0001_init.sql.
-- ============================================================

-- Lien vers un événement extérieur (billetterie, page Facebook, site du lieu…)
alter table plans
  add column link_url text
  check (link_url is null or (link_url ~* '^https?://' and char_length(link_url) <= 500));

-- L'image de couverture utilise la colonne existante plans.cover_path,
-- stockée dans le bucket privé plan-photos sous {group_id}/covers/{uuid}.webp.
-- Limite à 5 Mo et aux formats image courants.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
where id = 'plan-photos';
