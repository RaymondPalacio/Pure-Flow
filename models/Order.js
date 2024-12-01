const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true }, // Added email field
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: { type: String },
            price: { type: Number },
            quantity: { type: Number },
        },
    ],
    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 10 },
    createdAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Declined", "ShippedOut", "Delivered"], // Allowed values
        default: "Pending", // Default value
    },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
