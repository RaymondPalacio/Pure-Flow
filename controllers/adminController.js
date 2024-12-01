
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports.upload = upload;



exports.adminDashboard = async (req, res) => {
    if (req.user && req.user.role === "admin") {
        try {
            const products = await Product.find({});
            const orders = await Order.find({}).populate("user", "email"); // Fetch orders and include user email
            
            res.render("admindashboard", {
                user: req.user, 
                products: products,
                orders: orders // Pass orders to the view
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).send("An error occurred while fetching data.");
        }
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
};


exports.addProduct = async (req, res) => {
    try {
        const { name, price, description, category, stock } = req.body;

        if (req.file) {
            console.log("File received:", req.file);
        } else {
            console.log("No file uploaded.");
        }

        const newProduct = new Product({
            name,
            price,
            description,
            category,
            stock,
            image: req.file
                ? { data: req.file.buffer, contentType: req.file.mimetype }
                : null
        });

        await newProduct.save();
        console.log("Product saved:", newProduct);
        res.redirect("/admindashboard");
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("An error occurred while adding the product.");
    }
};

exports.getProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.image.data) {
            return res.status(404).send("Image not found.");
        }

        res.contentType(product.image.contentType);
        res.send(product.image.data);
    } catch (error) {
        console.error("Error fetching product image:", error);
        res.status(500).send("An error occurred while fetching the image.");
    }
};




exports.showAddProductForm = (req, res) => {
    if (req.user && req.user.role === "admin") {
        res.render("addproduct"); 
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
};

exports.showEditProductForm = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }
        res.render("editproduct", { product });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send("An error occurred while fetching the product.");
    }
};

exports.updateProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, price, description, category, stock } = req.body;
    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { name, price, description, category, stock },
            { new: true }  
        );
        if (!product) {
            return res.status(404).send("Product not found.");
        }
        res.redirect("/admindashboard");
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("An error occurred while updating the product.");
    }
};  



exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).send("Product not found.");
        }
        res.redirect("/admindashboard");
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("An error occurred while deleting the product.");
    }
};

exports.viewOrders = async (req, res) => {
    if (req.user && req.user.role === "admin") {
        try {
            // Fetch all orders and populate user details
            const orders = await Order.find({}).populate("user");

            res.render("orders", {
                user: req.user, // Admin user details
                orders: orders, // All orders
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).send("An error occurred while fetching orders.");
        }
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
};
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params; // Order ID from the URL
    const { status } = req.body; // New status from the form submission

    try {
        // Validate the status
        const allowedStatuses = ["Pending", "Accepted", "Declined", "ShippedOut", "Delivered"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).send("Invalid status.");
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(
            id,
            { status: status },
            { new: true } // Return the updated order
        );

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        console.log("Order status updated:", order);
        res.redirect("/orders"); // Redirect back to the orders page
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).send("An error occurred while updating the order status.");
    }
};


