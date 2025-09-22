-- AlterTable
ALTER TABLE "public"."relatorios" ADD COLUMN     "adiantamento" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "saldo_restante" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "status_reembolso" TEXT NOT NULL DEFAULT 'pendente',
ADD COLUMN     "valor_reembolso" DECIMAL(65,30);
