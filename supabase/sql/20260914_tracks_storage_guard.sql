-- Safety patch for old installations that still use a tracks table.
-- The current schema uses audio_sources, but some deployed databases may
-- still have tracks(storage_path NOT NULL).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='tracks'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION prevent_empty_track_storage_path()
      RETURNS trigger AS $body$
      BEGIN
        IF NEW.storage_path IS NULL OR trim(NEW.storage_path) = '' THEN
          RAISE EXCEPTION 'storage_path is required. Upload audio to Supabase Storage before creating track';
        END IF;
        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql;
    $fn$;

    EXECUTE 'DROP TRIGGER IF EXISTS tracks_storage_path_guard ON public.tracks';

    EXECUTE $trg$
      CREATE TRIGGER tracks_storage_path_guard
      BEFORE INSERT OR UPDATE ON public.tracks
      FOR EACH ROW EXECUTE FUNCTION prevent_empty_track_storage_path();
    $trg$;
  END IF;
END $$;
