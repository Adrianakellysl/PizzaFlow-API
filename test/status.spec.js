const { expect } = require("chai");
const {
  request,
  app,
  obterTokenValido,
  resetarEstadoDeTeste,
  authHeader,
  postPedido,
} = require("./setup");

describe("BDD - Atualizacao de status do pedido", () => {
  let token;

  function criarPedido(cliente) {
    return postPedido(token, {
      cliente,
      itens: [{ nome: "Pizza Mussarela", quantidade: 1 }],
    });
  }

  function patchStatus(id, status) {
    return request(app)
      .patch(`/api/pedidos/${id}/status`)
      .set(authHeader(token))
      .send({ status });
  }

  beforeEach(async () => {
    resetarEstadoDeTeste();
    token = await obterTokenValido();
  });

  it("CT-STATUS-001: deve atualizar status na sequencia correta", async () => {
    const pedido = await criarPedido("Cliente Fluxo Valido");
    const id = pedido.body.id;

    const resposta1 = await patchStatus(id, "preparando");
    const resposta2 = await patchStatus(id, "pronto");
    const resposta3 = await patchStatus(id, "entregue");

    expect(resposta1.status).to.equal(200);
    expect(resposta2.status).to.equal(200);
    expect(resposta3.status).to.equal(200);
  });

  it("CT-STATUS-002: deve bloquear pulo de etapa", async () => {
    const pedido = await criarPedido("Cliente Pulo Etapa");
    const resposta = await patchStatus(pedido.body.id, "pronto");

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Transicao de status invalida. Siga a ordem: recebido -> preparando -> pronto -> entregue.");
  });

  it("CT-STATUS-003: deve bloquear retorno para etapa anterior", async () => {
    const pedido = await criarPedido("Cliente Volta Etapa");
    await patchStatus(pedido.body.id, "preparando");
    await patchStatus(pedido.body.id, "pronto");
    
    const resposta = await patchStatus(pedido.body.id, "preparando");

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Transicao de status invalida. Siga a ordem: recebido -> preparando -> pronto -> entregue.");
  });

  it("CT-STATUS-004: deve bloquear alteracao de pedido ja entregue", async () => {
    const pedido = await criarPedido("Cliente Pedido Entregue");
    await patchStatus(pedido.body.id, "preparando");
    await patchStatus(pedido.body.id, "pronto");
    await patchStatus(pedido.body.id, "entregue");

    const resposta = await patchStatus(pedido.body.id, "entregue");

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Pedido ja foi entregue e nao pode ser alterado.");
  });

  it("CT-STATUS-005: deve retornar 400 para status invalido", async () => {
    const pedido = await criarPedido("Cliente Status Invalido");
    const resposta = await patchStatus(pedido.body.id, "cancelado");

    expect(resposta.status).to.equal(400);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Status informado e invalido.");
  });

  it("CT-STATUS-006: deve retornar 404 para pedido inexistente", async () => {
    const resposta = await request(app)
      .patch("/api/pedidos/9999/status")
      .set(authHeader(token))
      .send({ status: "preparando" });

    expect(resposta.status).to.equal(404);
    expect(resposta.body).to.have.property("erro").that.is.a("string").and.not.empty;
    expect(resposta.body.erro).to.equal("Pedido nao encontrado.");
  });
});
