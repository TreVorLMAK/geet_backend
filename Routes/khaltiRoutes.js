const express = require("express");
const axios = require("axios");
const Donation = require('../model/donationModel');
const Payment = require('../model/paymentModel');
const router = express.Router();

router.post("/initiate-donation", async (req, res) => {
  const { amount, donorName, returnUrl } = req.body;
  
  try {
    const donation = new Donation({ donorName, amount });
    await donation.save();

    const paymentDetails = {
      amount: amount * 100,
      purchase_order_id: donation._id,
      purchase_order_name: "Donation",
      return_url: returnUrl,
      website_url: "http://localhost:3000",
    };

    const response = await axios.post("https://a.khalti.com/api/v2/epayment/initiate/", paymentDetails, {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      }
    });

    res.json({
      success: true,
      paymentUrl: response.data.payment_url,
      donationId: donation._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
      }
    });

    const paymentInfo = response.data;

    if (paymentInfo.status === "Completed" && paymentInfo.transaction_id === transaction_id) {
      const donation = await Donation.findById(purchase_order_id);
      if (!donation.transactionId) {
        donation.transactionId = paymentInfo.transaction_id;
      }
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
      res.status(400).json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
