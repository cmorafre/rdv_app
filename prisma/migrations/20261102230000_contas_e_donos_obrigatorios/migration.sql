-- Migração B (contas e donos): conta e dono passam a ser obrigatórios e a placa
-- deixa de ser única no sistema todo para ser única dentro de cada conta.
-- Pré-requisito: nenhum registro sem conta/dono (preencher-conta-principal.sql).


-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_conta_id_fkey";

-- DropForeignKey
ALTER TABLE "relatorios" DROP CONSTRAINT "relatorios_conta_id_fkey";

-- DropForeignKey
ALTER TABLE "relatorios" DROP CONSTRAINT "relatorios_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "veiculos" DROP CONSTRAINT "veiculos_conta_id_fkey";

-- DropForeignKey
ALTER TABLE "veiculos" DROP CONSTRAINT "veiculos_usuario_id_fkey";

-- DropIndex
DROP INDEX "veiculos_identificacao_key";

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "conta_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "relatorios" ALTER COLUMN "conta_id" SET NOT NULL,
ALTER COLUMN "usuario_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "veiculos" ALTER COLUMN "conta_id" SET NOT NULL,
ALTER COLUMN "usuario_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_conta_id_identificacao_key" ON "veiculos"("conta_id", "identificacao");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

