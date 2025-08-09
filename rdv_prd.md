# PRD - Aplicativo RDV (Relatório de Despesas de Viagem)

**Versão:** 1.0  
**Data:** Agosto 2025  
**Autor:** Engenheiro de Software Sênior  
**Status:** Draft  

## 1. Visão Geral do Produto

### 1.1 Objetivo
Desenvolver um aplicativo web moderno para gestão de relatórios de despesas de viagem (RDV) para uso pessoal, oferecendo uma interface intuitiva e funcionalidades completas para controle financeiro de viagens.

### 1.2 Proposta de Valor
- Interface moderna e minimalista baseada em shadcn/ui
- Gestão completa de relatórios e despesas de viagem
- Categorização automática de despesas
- Integração com mapas para cálculo de quilometragem
- Geração automática de relatórios em PDF
- Controle de reembolsos e clientes

### 1.3 Público-Alvo
Profissionais que precisam controlar despesas de viagem para reembolso empresarial ou controle pessoal.

## 2. Especificações Técnicas

### 2.1 Stack Tecnológico
- **Frontend:** Next.js 14+ com App Router
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** SQLite com Prisma ORM
- **Maps:** Google Maps API
- **PDF Generation:** jsPDF ou react-pdf
- **File Upload:** Next.js API Routes
- **State Management:** Zustand ou React Context
- **Forms:** React Hook Form + Zod validation

### 2.2 Arquitetura
```
/src
  /app
    /dashboard
    /relatorios
    /despesas
    /api
  /components
    /ui (shadcn/ui components)
    /forms
    /layouts
  /lib
    /database
    /utils
  /types
```

## 3. Requisitos Funcionais

### 3.1 Autenticação e Autorização
- [ ] Sistema de login simples (para uso pessoal)
- [ ] Proteção de rotas
- [ ] Sessão persistente

### 3.2 Dashboard
- [ ] Visão geral de gastos por período
- [ ] Gráficos de despesas por categoria
- [ ] Relatórios pendentes de fechamento
- [ ] Resumo financeiro mensal/anual
- [ ] Cards com métricas principais

### 3.3 Gestão de Relatórios

#### 3.3.1 Novo Relatório
- [ ] Formulário de criação com campos:
  - Título do relatório
  - Data início/fim da viagem
  - Destino
  - Propósito da viagem
  - Status (Em andamento, Finalizado, Reembolsado)
  - Cliente/Projeto (opcional)
  - Observações

#### 3.3.2 Todos os Relatórios
- [ ] Lista paginada de todos os relatórios
- [ ] Filtros por:
  - Período
  - Status
  - Cliente/Projeto
  - Valor total
- [ ] Ações em lote
- [ ] Busca por texto
- [ ] Ordenação por colunas

### 3.4 Gestão de Despesas

#### 3.4.1 Cadastrar Nova Despesa
- [ ] Seleção de relatório associado
- [ ] Categorias predefinidas:
  - Aluguel de carro
  - Avião
  - Combustível
  - Diversos
  - Estacionamento
  - Hotel
  - Internet
  - Pagamento adiantado
  - Pedágio
  - Quilometragem
  - Restaurante
  - Táxi
  - Telefone
  - Transporte público
  - Trem

- [ ] Campos do formulário:
  - Data da despesa
  - Descrição/Fornecedor
  - Valor total
  - Categoria
  - Tipo de refeição (para restaurantes)
  - Detalhes da refeição (colegas/clientes)
  - Upload de comprovante (foto/PDF)
  - Observações
  - Marcadores de reembolso

#### 3.4.2 Despesa de Quilometragem
- [ ] Integração com Google Maps
- [ ] Campos específicos:
  - Veículo utilizado
  - Endereço origem/destino
  - Distância calculada automaticamente
  - Valor por km configurável
  - Percursos preferidos
- [ ] Visualização da rota no mapa
- [ ] Cálculo automático do valor

#### 3.4.3 Gestão de Veículos
- [ ] Cadastro de veículos pessoais
- [ ] Campos:
  - Tipo (Pessoal, Empresa, Financiado, Alugado)
  - Marca/Modelo
  - Categoria
  - Combustível
  - Identificação (placa)
  - Potência
  - Valor por km
  - Documentos do veículo (upload)

#### 3.4.4 Todas as Despesas
- [ ] Lista consolidada de todas as despesas
- [ ] Filtros avançados:
  - Relatório
  - Categoria
  - Período
  - Valor
  - Status de reembolso
- [ ] Ações em lote:
  - Marcar como reembolsada
  - Alterar categoria
  - Duplicar despesa
  - Exportar selecionadas

### 3.5 Relatórios e Exportação
- [ ] Geração de PDF do relatório completo
- [ ] Visualização prévia antes da exportação
- [ ] Inclusão de mapas em despesas de quilometragem
- [ ] Anexação de comprovantes no PDF
- [ ] Templates personalizáveis
- [ ] Exportação em Excel/CSV

### 3.6 Configurações
- [ ] Categorias personalizadas
- [ ] Valores padrão por km
- [ ] Templates de relatório
- [ ] Configurações de moeda
- [ ] Backup/Restore de dados

## 4. Requisitos Não Funcionais

### 4.1 Performance
- [ ] Carregamento inicial < 3 segundos
- [ ] Navegação entre páginas < 1 segundo
- [ ] Upload de imagens otimizado
- [ ] Lazy loading de imagens
- [ ] Paginação eficiente

### 4.2 Usabilidade
- [ ] Interface responsiva (mobile-first)
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] Feedback visual para todas as ações
- [ ] Estados de loading apropriados
- [ ] Shortcuts de teclado

### 4.3 Confiabilidade
- [ ] Backup automático local
- [ ] Validação robusta de dados
- [ ] Tratamento de erros elegante
- [ ] Offline-first approach (PWA)

## 5. Esquema do Banco de Dados

### 5.1 Tabelas Principais

```sql
-- Relatórios
CREATE TABLE relatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo VARCHAR(255) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  destino VARCHAR(255),
  proposito TEXT,
  status VARCHAR(50) DEFAULT 'em_andamento',
  cliente VARCHAR(255),
  observacoes TEXT,
  valor_total DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categorias
CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(50),
  cor VARCHAR(7),
  ativa BOOLEAN DEFAULT TRUE
);

-- Veículos
CREATE TABLE veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo VARCHAR(50) NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  categoria VARCHAR(50),
  combustivel VARCHAR(50),
  identificacao VARCHAR(20),
  potencia INTEGER,
  valor_por_km DECIMAL(5,3),
  ativo BOOLEAN DEFAULT TRUE
);

-- Despesas
CREATE TABLE despesas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  relatorio_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  data_despesa DATE NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  fornecedor VARCHAR(255),
  valor DECIMAL(10,2) NOT NULL,
  comprovante_url VARCHAR(500),
  observacoes TEXT,
  reembolsavel BOOLEAN DEFAULT TRUE,
  reembolsada BOOLEAN DEFAULT FALSE,
  cliente_a_cobrar BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (relatorio_id) REFERENCES relatorios(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Despesas de Quilometragem
CREATE TABLE despesas_quilometragem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  despesa_id INTEGER NOT NULL,
  veiculo_id INTEGER NOT NULL,
  origem VARCHAR(500) NOT NULL,
  destino VARCHAR(500) NOT NULL,
  distancia_km DECIMAL(8,2) NOT NULL,
  valor_por_km DECIMAL(5,3) NOT NULL,
  percurso_dados JSON,
  FOREIGN KEY (despesa_id) REFERENCES despesas(id),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);
```

## 6. Design System e UI/UX

### 6.1 Princípios de Design
- **Minimalismo:** Interface limpa baseada em shadcn/ui
- **Consistência:** Componentes reutilizáveis e padrões consistentes
- **Acessibilidade:** Cores contrastantes e navegação por teclado
- **Responsive:** Mobile-first design

### 6.2 Paleta de Cores
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --border: 214.3 31.8% 91.4%;
}
```

### 6.3 Componentes Principais
- [ ] Sidebar com navegação (shadcn/ui)
- [ ] Cards informativos
- [ ] Formulários com validação
- [ ] Tabelas com paginação
- [ ] Modais para ações
- [ ] Toast notifications
- [ ] Loading skeletons

### 6.4 Layout da Aplicação
```
┌─────────────────────────────────────────┐
│ Header (breadcrumb + user menu)         │
├─────────────┬───────────────────────────┤
│             │                           │
│   Sidebar   │     Main Content          │
│             │                           │
│ • Dashboard │   ┌─────────────────────┐ │
│ • Relatórios│   │                     │ │
│   - Novo    │   │    Page Content     │ │
│   - Todos   │   │                     │ │
│ • Despesas  │   │                     │ │
│   - Nova    │   └─────────────────────┘ │
│   - Todas   │                           │
│             │                           │
└─────────────┴───────────────────────────┘
```

## 7. Roadmap de Desenvolvimento

### 7.1 Fase 1 - Core (Semanas 1-4)
- [ ] Setup do projeto e configurações
- [ ] Estrutura do banco de dados
- [ ] Autenticação básica
- [ ] Layout principal com sidebar
- [ ] CRUD básico de relatórios

### 7.2 Fase 2 - Despesas (Semanas 5-8)
- [ ] CRUD de despesas básicas
- [ ] Sistema de categorias
- [ ] Upload de comprovantes
- [ ] Formulários com validação

### 7.3 Fase 3 - Recursos Avançados (Semanas 9-12)
- [ ] Integração com Google Maps
- [ ] Gestão de veículos e quilometragem
- [ ] Geração de PDFs
- [ ] Dashboard com métricas

### 7.4 Fase 4 - Polimento (Semanas 13-16)
- [ ] Otimizações de performance
- [ ] Testes automatizados
- [ ] PWA features
- [ ] Documentação final

## 8. Critérios de Aceitação

### 8.1 Funcionalidade
- [ ] Usuário pode criar, editar e excluir relatórios
- [ ] Usuário pode adicionar despesas a relatórios
- [ ] Sistema calcula automaticamente totais
- [ ] PDFs são gerados corretamente
- [ ] Mapas funcionam para quilometragem

### 8.2 Performance
- [ ] Aplicação carrega em menos de 3 segundos
- [ ] Navegação é fluida em dispositivos móveis
- [ ] Upload de imagens é otimizado

### 8.3 Usabilidade
- [ ] Interface é intuitiva para novos usuários
- [ ] Funciona corretamente em mobile
- [ ] Feedback visual adequado para todas as ações

## 9. Riscos e Mitigações

### 9.1 Riscos Técnicos
- **Integração Google Maps:** Configurar chaves de API corretamente
- **Performance SQLite:** Implementar índices adequados
- **Upload de arquivos:** Limitar tamanho e tipos

### 9.2 Riscos de Usabilidade
- **Complexidade:** Manter interface simples apesar das funcionalidades
- **Mobile:** Garantir boa experiência em telas pequenas

## 10. Métricas de Sucesso

- [ ] Tempo de cadastro de despesa < 2 minutos
- [ ] Geração de PDF < 10 segundos
- [ ] 0 bugs críticos em produção
- [ ] Interface responsiva em 100% das telas

## 11. Considerações de Implementação

### 11.1 Estrutura de Pastas Sugerida
```
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── relatorios/
│   ├── despesas/
│   └── api/
├── components/
│   ├── ui/
│   ├── forms/
│   └── layouts/
├── lib/
│   ├── db/
│   ├── utils/
│   └── validations/
└── types/
```

### 11.2 Próximos Passos
1. Validar PRD com stakeholders
2. Setup do ambiente de desenvolvimento
3. Criação do design system base
4. Implementação da Fase 1

---

**Documento preparado por:** Engenheiro de Software Sênior  
**Aprovação necessária de:** Product Owner  
**Revisão técnica:** Equipe de Desenvolvimento