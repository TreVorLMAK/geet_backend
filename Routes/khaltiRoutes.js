const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const Donation = require('../model/donationModel');
const Payment = require('../model/paymentModel');
const router = express.Router();

router.post("/initiate-donation", async (req, res) => {
  const { amount, donorName, returnUrl } = req.body;

  if (!amount || !donorName || !returnUrl) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const paymentDetails = {
      amount: amount * 100,
      purchase_order_id: new mongoose.Types.ObjectId(),
      purchase_order_name: "Donation",
      return_url: returnUrl,
      website_url: "http://localhost:3000",
    };

    const response = await axios.post("https://a.khalti.com/api/v2/epayment/initiate/", paymentDetails, {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const donation = new Donation({
      _id: paymentDetails.purchase_order_id,
      donorName,
      amount,
    });
    await donation.save();

    res.json({
      success: true,
      paymentUrl: response.data.payment_url,
      donationId: donation._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to initiate payment", error: error.message });
  }
});

router.get("/complete-donation", async (req, res) => {
  const { pidx, txnId, amount, purchase_order_id, transaction_id } = req.query;

  try {
    const response = await axios.post("https://a.khalti.com/api/v2/epayment/lookup/", {
      pidx,
    }, {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const paymentInfo = response.data;

    const donation = await Donation.findById(purchase_order_id);

    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    if (donation.status === "completed") {
      return res.json({ success: true, message: "Donation already completed" });
    }

    if (paymentInfo.status === "Completed" && paymentInfo.transaction_id === transaction_id) {
      donation.transactionId = donation.transactionId || paymentInfo.transaction_id;
      donation.status = "completed";
      await donation.save();

      const payment = new Payment({
        donationId: donation._id,
        transactionId: paymentInfo.transaction_id,
        amount: amount,
        status: "success",
        paymentMethod: "khalti",
      });
      await payment.save();

      res.json({ success: true, message: "Payment successful", payment });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to verify payment", error: error.message });
  }
});


module.exports = router;
