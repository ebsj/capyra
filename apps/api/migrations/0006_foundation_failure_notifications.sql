-- Terminal transitions create a single sanitized owner notification atomically.
CREATE TRIGGER analysis_terminal_failure_notification AFTER UPDATE OF status ON video_analyses
WHEN OLD.status='pending' AND NEW.status='failed' AND NEW.deleted_at IS NULL
BEGIN
 INSERT INTO notifications(id,account_id,owner_id,brand_id,code,message,resource_id,created_at)
 SELECT lower(printf('%08x-%04x-7%s-a%s-%s',ms/65536,ms%65536,substr(hex(randomblob(2)),2,3),substr(hex(randomblob(2)),2,3),hex(randomblob(6)))),
 NEW.account_id,u.id,NEW.brand_id,'analysis_failed','A análise não pôde ser concluída. A reserva foi liberada; revise o vídeo antes de tentar novamente.',NEW.id,NEW.updated_at
 FROM account_users u CROSS JOIN (SELECT CAST(strftime('%s','now') AS INTEGER)*1000+CAST(substr(strftime('%f','now'),4,3) AS INTEGER) AS ms)
 WHERE u.account_id=NEW.account_id AND u.role='owner';
END;
CREATE TRIGGER media_terminal_failure_notification AFTER UPDATE OF metadata_status ON source_assets
WHEN OLD.metadata_status='pending' AND NEW.metadata_status='failed' AND NEW.deleted_at IS NULL
BEGIN
 INSERT INTO notifications(id,account_id,owner_id,brand_id,code,message,resource_id,created_at)
 SELECT lower(printf('%08x-%04x-7%s-a%s-%s',ms/65536,ms%65536,substr(hex(randomblob(2)),2,3),substr(hex(randomblob(2)),2,3),hex(randomblob(6)))),
 NEW.account_id,u.id,NEW.brand_id,'media_inspection_failed','Não foi possível validar a mídia. Envie um arquivo válido em um dos formatos aceitos.',NEW.id,strftime('%Y-%m-%dT%H:%M:%fZ','now')
 FROM account_users u CROSS JOIN (SELECT CAST(strftime('%s','now') AS INTEGER)*1000+CAST(substr(strftime('%f','now'),4,3) AS INTEGER) AS ms)
 WHERE u.account_id=NEW.account_id AND u.role='owner';
END;
