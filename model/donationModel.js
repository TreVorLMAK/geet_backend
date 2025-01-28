const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donorName: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  transactionId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const Donation = mongoose.model("Donation", donationSchema);
module.exports = Donation;