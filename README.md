# Santo Circuito Operações

Aplicação React/TypeScript para gestão da operação da I Corrida de São Francisco — Noronha 2026.

## Recursos

- Supabase Auth com login e recuperação de senha;
- dashboard e cronograma alimentados pelo banco;
- tarefas em lista, tabela, Kanban e calendário;
- filtros, pesquisa e ordenação;
- detalhes da tarefa, checklist, comentários, dúvidas, anexos e histórico;
- CRUD de áreas, riscos, marcos e evidências;
- equipe, permissões, convites e notificações;
- layout responsivo e estados de carregamento, vazio e erro;
- cache com TanStack Query.

O frontend consome exclusivamente o schema existente. As migrations versionadas são documentação histórica e não precisam ser executadas.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variáveis necessárias:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Use somente a chave pública/publishable no frontend.

## Validação

```bash
npm run lint
npm run build
```

## Vercel

Defina as duas variáveis acima no projeto da Vercel. O arquivo `vercel.json` já configura o fallback de rotas da SPA. Build command: `npm run build`; output: `dist`.
