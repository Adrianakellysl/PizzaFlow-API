const pedidoService = require("../services/pedidoService");
const { validarBody, validarPedidoId } = require("../helpers/validators");

function criarPedido(req, res) {
  if (!validarBody(req, res)) {
    return;
  }

  const { cliente, itens } = req.body;
  const resultado = pedidoService.criarPedido(cliente, itens);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(201).json(resultado.pedido);
}

function atualizarStatus(req, res) {
  if (!validarBody(req, res)) {
    return;
  }

  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const { status } = req.body;
  const resultado = pedidoService.atualizarStatusPedido(pedidoId, status);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(200).json(resultado.pedido);
}

function buscarPedido(req, res) {
  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const pedido = pedidoService.buscarPedidoPorId(pedidoId);
  if (!pedido) {
    return res.status(404).json({ erro: "Pedido nao encontrado." });
  }

  return res.status(200).json(pedido);
}

function listarPedidos(req, res) {
  const lista = pedidoService.listarPedidos();
  return res.status(200).json(lista);
}

function atualizarPedido(req, res) {
  if (!validarBody(req, res)) {
    return;
  }

  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const { cliente, itens } = req.body;
  const resultado = pedidoService.atualizarPedido(pedidoId, cliente, itens);

  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(200).json(resultado.pedido);
}

function excluirPedido(req, res) {
  const pedidoId = validarPedidoId(req, res);
  if (pedidoId === null) {
    return;
  }

  const resultado = pedidoService.excluirPedido(pedidoId);
  if (!resultado.sucesso) {
    return res.status(resultado.status).json({ erro: resultado.erro });
  }

  return res.status(204).send();
}

module.exports = {
  criarPedido,
  atualizarStatus,
  atualizarPedido,
  excluirPedido,
  buscarPedido,
  listarPedidos,
};
