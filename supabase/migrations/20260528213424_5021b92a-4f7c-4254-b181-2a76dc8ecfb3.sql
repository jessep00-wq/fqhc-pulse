
-- Add slug column to newsletters with auto-generation
ALTER TABLE public.newsletters ADD COLUMN IF NOT EXISTS slug text;

-- Slug generator function
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(
    regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
    '-+', '-', 'g'
  ));
$$;

-- Backfill slugs from titles, dedup with short id suffix
UPDATE public.newsletters
SET slug = public.slugify(title) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL;

-- Enforce uniqueness + not null
ALTER TABLE public.newsletters ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS newsletters_slug_unique ON public.newsletters(slug);

-- Trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.newsletters_autoslug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.title) || '-' || substr(NEW.id::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletters_autoslug_trg ON public.newsletters;
CREATE TRIGGER newsletters_autoslug_trg
BEFORE INSERT ON public.newsletters
FOR EACH ROW EXECUTE FUNCTION public.newsletters_autoslug();
