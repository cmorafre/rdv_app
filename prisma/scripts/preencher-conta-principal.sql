-- Preenchimento da migração A (contas e donos), rodado uma vez em produção depois de
-- `prisma migrate deploy`. Todos os dados atuais vão para a conta principal, com o
-- gestor como dono. Pode ser rodado de novo: só preenche o que ainda está vazio.
--
-- Uso: psql ... -v gestor_email=c.morafre@gmail.com -f preencher-conta-principal.sql

\set ON_ERROR_STOP on
BEGIN;

-- O gestor precisa existir antes de tudo
SELECT id AS gestor_id FROM usuarios WHERE email = :'gestor_email' \gset

INSERT INTO contas (nome, tipo, updated_at)
SELECT 'Conta principal', 'empresa', now()
WHERE NOT EXISTS (SELECT 1 FROM contas);

SELECT min(id) AS conta_id FROM contas \gset

UPDATE usuarios SET conta_id = :conta_id WHERE conta_id IS NULL;
UPDATE usuarios SET perfil = 'gestor' WHERE id = :gestor_id;

UPDATE relatorios SET conta_id = :conta_id, usuario_id = :gestor_id WHERE conta_id IS NULL;
UPDATE veiculos   SET conta_id = :conta_id, usuario_id = :gestor_id WHERE conta_id IS NULL;

COMMIT;
