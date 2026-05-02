function validarBody(req, res, mensagem = "Body nao enviado.") {
  if (!req.body) {
    res.status(400).json({ erro: mensagem });
    return false;
  }

  return true;
}

function validarPedidoId(req, res) {
  const pedidoId = Number(req.params.id);

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    res.status(400).json({ erro: "ID do pedido invalido." });
    return null;
  }

  return pedidoId;
}

module.exports = {
  validarBody,
  validarPedidoId,
};
