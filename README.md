# PizzaFlow API

PizzaFlow e uma API REST desenvolvida para simular o fluxo de pedidos de uma pizzaria. O sistema oferece funcionalidades de autenticacao de usuarios e gerenciamento de pedidos, utilizando armazenamento em memoria para simplificar a implementacao e facilitar testes automatizados.

## Tecnologias

- Node.js
- Express
- JSON Web Token (`jsonwebtoken`)
- Dotenv (`dotenv`)

## O que há de novo

- Suporte a variáveis de ambiente via arquivo `.env`
- `JWT_SECRET` e `PORT` agora podem ser configurados sem alterar o código
- `.env` é ignorado pelo Git por segurança

## Estrutura do projeto

```text
src/
  app.js
  routes/
    index.js
    authRoutes.js
    pedidoRoutes.js
  controllers/
    authController.js
    pedidoController.js
  services/
    authService.js
    pedidoService.js
  middlewares/
    authMiddleware.js
  data/
    cardapio.js
    pedidos.js
    statusPedido.js
    usuario.js
swagger.json
```

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Crie um arquivo `.env` na raiz do projeto.

Você pode copiar o exemplo:

```bash
cp .env.example .env
```

3. Ajuste os valores em `.env`:

```env
PORT=3000
JWT_SECRET=seu-segredo-forte
NODE_ENV=development
```

4. Inicie o servidor:

```bash
npm start
```

5. A API estará disponivel em:

```text
http://localhost:3000
```

## Variáveis de ambiente suportadas

- `PORT` - porta em que o servidor escuta (padrão: `3000`)
- `JWT_SECRET` - segredo usado para assinar tokens JWT
- `NODE_ENV` - ambiente da aplicacao (padrão: `development`)

## Usuario mock para login

Use este usuario no endpoint de autenticação:

```json
{
  "email": "admin@pizzaria.com",
  "senha": "123456"
}
```

## Endpoints principais

### Health check

- `GET /`

Resposta 200:

```json
{
  "mensagem": "PizzaFlow API online.",
  "sistema": "PizzaFlow API",
  "versao": "1.0.0",
  "ambiente": "development",
  "timestamp": "2026-04-27T12:00:00.000Z"
}
```

### Login

- `POST /api/login`

Body:

```json
{
  "email": "admin@pizzaria.com",
  "senha": "123456"
}
```

Resposta 200:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "JWT_AQUI"
}
```

### Criar pedido

- `POST /api/pedidos`
- Header: `Authorization: Bearer <token>`

Body:

```json
{
  "cliente": "Maria Oliveira",
  "itens": [
    { "nome": "Pizza Calabresa", "quantidade": 1 },
    { "nome": "Refrigerante", "quantidade": 2 }
  ]
}
```

Regras de criação:

- `cliente` é obrigatório
- `itens` deve ser um array não vazio
- cada item deve conter `nome` e `quantidade`
- `quantidade` deve ser maior que zero
- item deve existir no cardápio
- o preço enviado no payload é ignorado
- o `total` é recalculado sempre usando o cardápio
- status inicial do pedido: `recebido`

### Atualizar status do pedido

- `PATCH /api/pedidos/:id/status`
- Header: `Authorization: Bearer <token>`

Body:

```json
{
  "status": "preparando"
}
```

Fluxo de status permitido:

`recebido -> preparando -> pronto -> entregue`

Restrições de status:

- não pode pular etapas
- não pode voltar para etapa anterior
- não pode alterar pedido com status `entregue`

### Editar pedido

- `PUT /api/pedidos/:id`
- Header: `Authorization: Bearer <token>`

Body:

```json
{
  "cliente": "Maria Oliveira Atualizada",
  "itens": [
    { "nome": "Pizza Mussarela", "quantidade": 2 },
    { "nome": "Refrigerante", "quantidade": 1 }
  ]
}
```

Regras de edição:

- pedido pode ser editado em qualquer status, exceto `entregue`
- o `total` é sempre recalculado a partir do cardápio
- o preço enviado no payload é ignorado

### Excluir pedido

- `DELETE /api/pedidos/:id`
- Header: `Authorization: Bearer <token>`

Regras de exclusão:

- somente pedidos com status `recebido` podem ser excluídos
- pedidos com status `preparando`, `pronto` ou `entregue` não podem ser excluídos
- se o pedido não existir, retorna `404`

### Buscar pedido por ID

- `GET /api/pedidos/:id`
- Header: `Authorization: Bearer <token>`

### Listar pedidos

- `GET /api/pedidos`
- Header: `Authorization: Bearer <token>`

## Scripts úteis

- `npm start` - inicia o servidor
- `npm test` - roda os testes com Mocha
- `npm run test:report` - gera relatório do Mocha em `mochawesome-report/`

Resposta:

- `204` quando excluido com sucesso
- `404` quando pedido nao existe

### 6) Buscar pedido por ID

- `GET /api/pedidos/:id`
- Requer header: `Authorization: Bearer <token>`

### 7) Listar pedidos

- `GET /api/pedidos`
- Requer header: `Authorization: Bearer <token>`

## Cardapio fixo (exemplos)

- Pizza Calabresa: 45
- Pizza Mussarela: 40
- Pizza Portuguesa: 48
- Pizza Frango com Catupiry: 50
- Pizza Quatro Queijos: 52
- Pizza Marguerita: 46
- Pizza Pepperoni: 54
- Refrigerante: 8
- Suco Natural: 10
- Agua: 5

## Swagger (OpenAPI)

O arquivo de documentacao OpenAPI esta em:

- `swagger.json`

Tambem esta disponivel em runtime:

- `GET /api/docs/swagger.json`

Para visualizar em interface grafica:

1. Abra [Swagger Editor](https://editor.swagger.io/)
2. Copie o conteudo de `swagger.json` ou importe a URL local

## Observacoes

- Como os dados ficam em memoria, ao reiniciar o servidor os pedidos sao perdidos.
- O segredo JWT usa `JWT_SECRET` por variavel de ambiente (com fallback local para estudo).
