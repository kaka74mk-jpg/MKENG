-- Safety migration
-- Verify existing audio rows before making playback dependent on Storage.
-- Rows without storage_path should be repaired through import-drive-audio.

update audio_sources
set status = 'error',
    error_message = coalesce(error_message, 'Storage path is missing; re-import audio file')
where storage_path is null
  and status = 'ready';
