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
    id: { type: Number, required: true, unique: true, index: true },
    cliente: { type: String, required: true, trim: true },
    itens: { type: [itemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["recebido", "preparando", "pronto", "entregue"],
      default: "recebido",
      required: true,
    },
    criadoEm: { type: String, required: true },
    atualizadoEm: { type: String },
  },
  { timestamps: true, versionKey: false }
);

pedidoSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Pedido", pedidoSchema);
