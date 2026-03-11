# ChocoNick — Sistema de Gestão para Buffet de Eventos

Sistema web para gestão de buffet de eventos (fondue de frutas com chocolate): orçamentos, contratos, clientes, ingredientes, agenda e financeiro.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Deploy:** Vercel

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- npm ou yarn

## Instalação

1. **Clone e instale dependências**

```bash
cd ChocoNick
npm install
```

2. **Configure o Supabase**

- Crie um projeto em [supabase.com](https://supabase.com).
- No SQL Editor, execute o conteúdo de `supabase/schema.sql` (cria tabelas, RLS e trigger de novo usuário).

3. **Variáveis de ambiente**

Copie o exemplo e preencha com as chaves do seu projeto Supabase:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto (Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anon/public
- Opcional: `NEXT_PUBLIC_APP_URL` para links em PDF/email (ex: `https://seusite.com`)
- Opcional: `RESEND_API_KEY` se for usar envio de email por Resend

4. **Rodar em desenvolvimento**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Cadastre-se; na primeira vez que abrir o dashboard, o sistema carrega os ingredientes e custos fixos iniciais (seed).

## Estrutura do projeto

- `src/app` — App Router (páginas e rotas)
  - `(auth)` — login, cadastro, recuperar senha
  - `(dashboard)` — área logada: dashboard, orçamento, clientes, agenda, ingredientes, financeiro, configurações
- `src/components` — componentes reutilizáveis e de módulos
- `src/lib` — cliente Supabase (browser e server)
- `src/types` — tipos TypeScript
- `supabase/schema.sql` — schema completo (tabelas + RLS + trigger)
- `supabase/seed.sql` — comentários; o seed real é feito via API no primeiro acesso

## Módulos

- **Autenticação:** login, cadastro (dados da empresa), recuperação de senha
- **Dashboard:** faturamento do mês, eventos confirmados, ticket médio, orçamentos pendentes, gráfico 6 meses, próximos eventos
- **Orçamento:** wizard em 4 etapas (dados do evento, calculadora de custos, pagamento, revisão), lista de orçamentos, detalhe com ações (PDF, WhatsApp, confirmar/contrato)
- **Clientes:** lista com busca, cadastro/edição, perfil com histórico de eventos
- **Ingredientes:** tabela, CRUD, ativar/desativar
- **Agenda:** calendário mensal com eventos por dia
- **Financeiro:** receitas (eventos realizados), despesas avulsas, resumo de lucratividade por período
- **Configurações:** dados da empresa, preço por km, margem padrão, foro do contrato

## Geração de PDF

Orçamento e contrato são gerados em **HTML** e abertos em nova aba. O usuário pode usar “Imprimir” do navegador e “Salvar como PDF” para obter o PDF.  
Para geração direta de PDF (arquivo .pdf), é possível integrar depois uma lib como `@react-pdf/renderer` ou um serviço de API.

## Deploy na Vercel

1. Conecte o repositório à Vercel.
2. Em **Settings → Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL do app na Vercel, ex: `https://choconick.vercel.app`)
3. Faça o deploy. A build usa `next build`.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — rodar build localmente
- `npm run lint` — ESLint

## Observações

- Os números de orçamento (ORC-AAAA-NNN) e contrato (CTR-AAAA-NNN) podem usar as funções SQL `next_budget_number()` e `next_contract_number()` do schema; há fallback em código se as funções não existirem.
- RLS no Supabase garante que cada usuário acesse apenas seus próprios dados (profiles, clients, events, ingredients, etc.).
