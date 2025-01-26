const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema({
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },
    transactionId: { type: String, unique: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["success", "failed"], default: "failed" },
    paymentMethod: { type: String, enum: ["khalti"], required: true },
    paymentDate: { type: Date, default: Date.now },
  }, { timestamps: true });
  
  const Payment = mongoose.model("Payment", paymentSchema);
  module.exports = Payment;