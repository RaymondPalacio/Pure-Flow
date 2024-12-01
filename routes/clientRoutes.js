const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const router = express.Router();

// Route to show client dashboard
router.get("/clientdashboard", dashboardController.clientdashboard);

// Route to handle adding a product to the cart
router.post("/clientdashboard/add-to-cart", dashboardController.addToCart);
router.get("/product/image/:id", dashboardController.getProductImage);  // this is fine
router.post("/remove-from-cart", dashboardController.removeFromCart);
router.get("/cart", dashboardController.viewCart);
router.get("/viewCart", dashboardController.viewCart);
router.post("/clientdashboard/search", dashboardController.searchProducts);
router.get("/edit-quantity", dashboardController.editQuantity);
router.post("/update-quantity", dashboardController.updateQuantity);
router.post("/checkout", dashboardController.checkout);
router.get("/order-summary", dashboardController.orderSummary);
router.get("/my-orders", dashboardController.viewClientOrders);
router.get("/order-history", dashboardController.viewDeliveredOrders);



module.exports = router;
