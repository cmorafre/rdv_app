-- AlterTable
ALTER TABLE "relatorios" ADD COLUMN     "aprovado_em" TIMESTAMP(3),
ADD COLUMN     "aprovado_por_id" INTEGER,
ADD COLUMN     "conta_id" INTEGER,
ADD COLUMN     "enviado_em" TIMESTAMP(3),
ADD COLUMN     "motivo_reprovacao" TEXT,
ADD COLUMN     "usuario_id" INTEGER;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "conta_id" INTEGER,
ADD COLUMN     "perfil" TEXT NOT NULL DEFAULT 'usuario';

-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN     "conta_id" INTEGER,
ADD COLUMN     "usuario_id" INTEGER;

-- CreateTable
CREATE TABLE "contas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'individual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relatorios_conta_id_usuario_id_idx" ON "relatorios"("conta_id", "usuario_id");

-- CreateIndex
CREATE INDEX "usuarios_conta_id_idx" ON "usuarios"("conta_id");

-- CreateIndex
CREATE INDEX "veiculos_conta_id_usuario_id_idx" ON "veiculos"("conta_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_aprovado_por_id_fkey" FOREIGN KEY ("aprovado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

