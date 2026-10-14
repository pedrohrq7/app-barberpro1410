# Backend BarberPro

O repositório agora contém uma API REST Express 5 e banco persistente SQLite via módulo integrado `node:sqlite`. A interface Expo chama essa API; não há fallback para autenticação, agendamentos ou gestão em memória. O arquivo SQLite é criado em `data/barbearia.sqlite` na primeira inicialização. A migração SQL inicial versionada fica em `backend/migrations/001_initial.sql` (`schema_migrations`, versão 1), e os seis serviços do catálogo são inseridos idempotentemente.

## Requisitos e configuração

Node.js **22.5 ou superior** e npm. Node habilita `node:sqlite` com uma flag experimental nessa versão; os scripts do projeto já passam a flag. Instale as dependências com `npm install`, copie `.env.example` para `.env` e defina os valores:

- `PORT`: porta HTTP, padrão 3000.
- `JWT_SECRET`: segredo aleatório de pelo menos 32 caracteres; obrigatório em produção.
- `JWT_EXPIRES_IN`: validade do JWT (padrão 7 dias).
- `DATABASE_PATH`: caminho SQLite persistente (padrão `./data/barbearia.sqlite`). Faça backup deste arquivo e de seus arquivos `-wal`/`-shm` apenas após parar o servidor ou através de backup SQLite consistente.
- `CORS_ORIGIN`: origens separadas por vírgula; padrão `*` (sem credenciais cross-origin). Em produção, informe os domínios do app web.
- `APP_TIME_ZONE`: fuso horário aplicado à validação de datas/horas; padrão `America/Sao_Paulo`.
- `TRUST_PROXY=true`: habilite somente se a API estiver atrás de um proxy confiável que sobrescreva `X-Forwarded-For`.
- `EXPO_PUBLIC_API_URL`: URL base da API usada pelo Expo. Configure para endereço alcançável pelo dispositivo; Android Emulator normalmente usa `http://10.0.2.2:3000/api`; dispositivo físico usa o IP LAN do computador, e implantação usa HTTPS.

A API escuta em `0.0.0.0`. Para desenvolvimento local, crie `.env` (não versionado) e configure `EXPO_PUBLIC_API_URL` com o mesmo endereço acessível pelo app.

## Executar

```bash
npm install
cp .env.example .env
# ajuste EXPO_PUBLIC_API_URL para o host correto
npm run server
```

Em outro terminal, rode o app com `npm start` / `npm run web`. Em produção defina `NODE_ENV=production`, `JWT_SECRET` seguro, caminho de banco persistente e CORS restrito.

## Endpoints

Públicos:

- `GET /health` — disponibilidade do serviço e conexão SQLite.
- `GET /api/services` — catálogo ativo, com barbeiros habilitados.
- `GET /api/barbers` — profissionais cadastrados.
- `GET /api/barbers/:id/services` — serviços ativos de um barbeiro.
- `GET /api/barbers/:id/availability?data=AAAA-MM-DD&servicoId=...` — horários livres, considerando duração e conflitos sobrepostos.
- `POST /api/auth/register` — cadastro de cliente ou barbeiro, senha mínima 8 caracteres.
- `POST /api/auth/login` — autenticação; retorna token bearer e perfil.

Autenticados (`Authorization: Bearer <token>`):

- `GET /api/auth/me`, `GET /api/profile` — perfil atual.
- `GET /api/appointments` — agenda do cliente ou agenda do barbeiro autenticado.
- `POST /api/appointments` — cliente agenda `{barbeiroId, servicoId, data, horario}`.
- `PATCH /api/appointments/:id/cancel` — cliente proprietário ou barbeiro responsável cancela pendente.
- `PATCH /api/appointments/:id/complete` — somente barbeiro responsável conclui pendente.
- `GET /api/barber/services`, `PATCH /api/barber/services/:id` — barbeiro lista e altera `{ativo, preco}` de seus serviços.
- `GET /api/barber/schedule`, `PUT /api/barber/schedule` — consulta agenda e salva `{horarios:["09:00", ...]}`.
- `GET /api/barber/dashboard` — estatísticas calculadas dos agendamentos persistidos.

As respostas de erro seguem `{error, code}` e usam status HTTP apropriados. Cadastro é limitado a 5 e login a 10 tentativas por IP a cada 15 minutos. A API não cria contas de demonstração nem senhas padrão: use o cadastro para criar contas reais.

## Persistência e segurança

Tabelas: `users`, `services`, `barber_services`, `barber_slots`, `appointments` e `schema_migrations`. E-mail é único sem diferenciar maiúsculas/minúsculas; FKs e checks protegem papéis, estados e preços. Senhas são armazenadas com bcrypt (12 rounds). Os tokens são assinados com JWT, expiram, e cada requisição protegida confirma usuário e papel. Alterações são parametrizadas e validações de payload usam Zod. O agendamento é transacional para impedir duas reservas conflitantes; o conflito considera duração e permite reutilizar horários cancelados. Preço/nome/duração do serviço são copiados para o agendamento para manter o histórico, mesmo após alterações futuras.

Os clientes não podem ver agendamentos de outros clientes, nem barbeiros operar sobre agenda alheia. O papel barbeiro selecionado na tela de cadastro libera o espaço de gestão: para produção aberta, a política de aprovação/verificação de profissionais precisaria ser definida pelo negócio.

## Testes

```bash
npm run test:api
npm run lint
```

Os testes de integração usam SQLite em memória, registram usuários, verificam hash de senha, autorização, catálogo, agendamento/conflicto, transições de estado e gestão do barbeiro. `npm run test:api` não altera o banco persistente local.
