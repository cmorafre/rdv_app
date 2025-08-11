-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."relatorios" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "destino" TEXT,
    "proposito" TEXT,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "cliente" TEXT,
    "observacoes" TEXT,
    "valor_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT,
    "cor" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."veiculos" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "categoria" TEXT,
    "combustivel" TEXT,
    "identificacao" TEXT NOT NULL,
    "potencia" INTEGER,
    "valor_por_km" DECIMAL(65,30) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."despesas" (
    "id" SERIAL NOT NULL,
    "relatorio_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "data_despesa" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "fornecedor" TEXT,
    "valor" DECIMAL(65,30) NOT NULL,
    "observacoes" TEXT,
    "reembolsavel" BOOLEAN NOT NULL DEFAULT true,
    "reembolsada" BOOLEAN NOT NULL DEFAULT false,
    "cliente_a_cobrar" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."despesas_quilometragem" (
    "id" SERIAL NOT NULL,
    "despesa_id" INTEGER NOT NULL,
    "veiculo_id" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "distancia_km" DECIMAL(65,30) NOT NULL,
    "valor_por_km" DECIMAL(65,30) NOT NULL,
    "percurso_dados" TEXT,

    CONSTRAINT "despesas_quilometragem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comprovantes" (
    "id" SERIAL NOT NULL,
    "despesa_id" INTEGER NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "tipo_mime" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprovantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "public"."categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_identificacao_key" ON "public"."veiculos"("identificacao");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_quilometragem_despesa_id_key" ON "public"."despesas_quilometragem"("despesa_id");

-- AddForeignKey
ALTER TABLE "public"."despesas" ADD CONSTRAINT "despesas_relatorio_id_fkey" FOREIGN KEY ("relatorio_id") REFERENCES "public"."relatorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesas" ADD CONSTRAINT "despesas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesas_quilometragem" ADD CONSTRAINT "despesas_quilometragem_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "public"."despesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."despesas_quilometragem" ADD CONSTRAINT "despesas_quilometragem_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "public"."veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comprovantes" ADD CONSTRAINT "comprovantes_despesa_id_fkey" FOREIGN KEY ("despesa_id") REFERENCES "public"."despesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
