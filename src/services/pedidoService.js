const cardapio = require("../data/cardapio");
const pedidos = require("../data/pedidos");
const fluxoStatus = require("../data/statusPedido");
let proximoId = 1;

function validarDadosPedido(cliente, itens) {
  if (!cliente || typeof cliente !== "string" || !cliente.trim()) {
    return { valido: false, erro: "Campo cliente e obrigatorio." };
  }

  if (!Array.isArray(itens)) {
    return { valido: false, erro: "Campo itens e obrigatorio e deve ser um array." };
  }

  if (itens.length === 0) {
    return { valido: false, erro: "O pedido deve ter pelo menos 1 item." };
  }

  for (const item of itens) {
    if (!item.nome || typeof item.nome !== "string") {
      return { valido: false, erro: "Cada item deve ter um nome valido." };
    }

    if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      return { valido: false, erro: "Cada item deve ter quantidade maior que zero." };
    }

    const produto = cardapio.find((produtoCardapio) => produtoCardapio.nome === item.nome);
    if (!produto) {
      return { valido: false, erro: `Item '${item.nome}' nao existe no cardapio.` };
    }
  }

  return { valido: true };
}

function calcularItens(itens) {
  return itens.map((item) => {
    const produto = cardapio.find((produtoCardapio) => produtoCardapio.nome === item.nome);
    const subtotal = produto.preco * item.quantidade;

    return {
      nome: produto.nome,
      quantidade: item.quantidade,
      precoUnitario: produto.preco,
      subtotal,
    };
  });
}

function criarPedido(cliente, itens) {
  const validacao = validarDadosPedido(cliente, itens);
  if (!validacao.valido) {
    return { sucesso: false, status: 400, erro: validacao.erro };
  }

  const itensCalculados = calcularItens(itens);
  const total = itensCalculados.reduce((acumulador, item) => acumulador + item.subtotal, 0);
  const novoId = proximoId;
  proximoId += 1;

  const pedido = {
    id: novoId,
    cliente: cliente.trim(),
    itens: itensCalculados,
    total,
    status: "recebido",
    criadoEm: new Date().toISOString(),
  };

  pedidos.push(pedido);

  return { sucesso: true, pedido };
}

function buscarPedidoPorId(id) {
  return pedidos.find((pedido) => pedido.id === id);
}

function listarPedidos() {
  return pedidos;
}

function atualizarPedido(id, cliente, itens) {
  const pedido = buscarPedidoPorId(id);
  if (!pedido) {
    return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
  }

  if (pedido.status === "entregue") {
    return { sucesso: false, status: 400, erro: "Pedido entregue nao pode ser editado." };
  }

  const validacao = validarDadosPedido(cliente, itens);
  if (!validacao.valido) {
    return { sucesso: false, status: 400, erro: validacao.erro };
  }

  const itensCalculados = calcularItens(itens);
  const total = itensCalculados.reduce((acumulador, item) => acumulador + item.subtotal, 0);

  pedido.cliente = cliente.trim();
  pedido.itens = itensCalculados;
  pedido.total = total;
  pedido.atualizadoEm = new Date().toISOString();

  return { sucesso: true, pedido };
}

function excluirPedido(id) {
  const pedido = buscarPedidoPorId(id);

  if (!pedido) {
    return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
  }

  if (pedido.status !== "recebido") {
    return {
      sucesso: false,
      status: 400,
      erro: "Somente pedidos com status 'recebido' podem ser excluidos.",
    };
  }

  const indicePedido = pedidos.findIndex((item) => item.id === id);
  pedidos.splice(indicePedido, 1);
  return { sucesso: true };
}

function atualizarStatusPedido(id, novoStatus) {
  if (!novoStatus || typeof novoStatus !== "string") {
    return { sucesso: false, status: 400, erro: "Campo status e obrigatorio." };
  }

  const pedido = buscarPedidoPorId(id);
  if (!pedido) {
    return { sucesso: false, status: 404, erro: "Pedido nao encontrado." };
  }

  if (!fluxoStatus.includes(novoStatus)) {
    return { sucesso: false, status: 400, erro: "Status informado e invalido." };
  }

  const indiceAtual = fluxoStatus.indexOf(pedido.status);
  const indiceNovo = fluxoStatus.indexOf(novoStatus);

  if (pedido.status === "entregue") {
    return { sucesso: false, status: 400, erro: "Pedido ja foi entregue e nao pode ser alterado." };
  }

  if (indiceNovo !== indiceAtual + 1) {
    return {
      sucesso: false,
      status: 400,
      erro: "Transicao de status invalida. Siga a ordem: recebido -> preparando -> pronto -> entregue.",
    };
  }

  pedido.status = novoStatus;
  pedido.atualizadoEm = new Date().toISOString();

  return { sucesso: true, pedido };
}

function resetarDadosPedidos() {
  pedidos.length = 0;
  proximoId = 1;
}

module.exports = {
  criarPedido,
  atualizarPedido,
  excluirPedido,
  atualizarStatusPedido,
  buscarPedidoPorId,
  listarPedidos,
  resetarDadosPedidos,
};
