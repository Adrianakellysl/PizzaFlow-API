const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    quantidade: { type: Number, required: true, min: 1 },
    precoUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
   {
    _id: { type: Number },
    cliente: { type: String, required: true, trim: true },

    itens: { type: [itemSchema], required: true },

    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["recebido", "preparando", "pronto", "entregue", "cancelado"],
      default: "recebido",
      required: true,
    },

    criadoEm: { type: Date, required: true },

    atualizadoEm: { type: Date },
  },
  {

    versionKey: false,
});

module.exports = mongoose.model("Pedido", pedidoSchema);
