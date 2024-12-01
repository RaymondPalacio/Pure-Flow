    const User = require("../models/User");
    const Product = require("../models/Product");
    const Order = require("../models/Order");

    exports.clientdashboard = async (req, res) => {
        if (req.user && req.user.role === "client") {
            try {
               
                const products = await Product.find();
                
                
                const cartItems = req.session.cart || [];

                
                const cartProducts = await Product.find({ _id: { $in: cartItems } });

                
                res.render("clientdashboard", { 
                    user: req.user,
                    products: products,
                    cart: cartProducts  
                });
            } catch (err) {
                console.error(err);
                res.status(500).send("Error retrieving products.");
            }
        } else {
            res.status(403).send("Access denied. Clients only.");
        }
    };

    exports.addToCart = async (req, res) => {
        try {
            const productId = req.body.productId;

            if (!req.session.cart) {
                req.session.cart = [];
            }

            
            const existingItem = req.session.cart.find((item) => item._id === productId);

            if (existingItem) {
                existingItem.quantity += 1; 
            } else {
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).send("Product not found.");
                }

                
                req.session.cart.push({ 
                    _id: productId, 
                    name: product.name, 
                    price: product.price, 
                    quantity: 1 
                });
            }

            res.redirect("/clientdashboard");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error adding product to cart.");
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


    exports.viewCart = async (req, res) => {
        try {
            const cart = req.session.cart || [];

            res.render("cart", { 
                user: req.user,
                cart: cart 
            });
        } catch (err) {
            console.error("Error retrieving cart items:", err);
            res.status(500).send("An error occurred while retrieving your cart.");
        }
    };


   
    exports.removeFromCart = (req, res) => {
        const { productId } = req.body;

        
        if (req.session.cart) {
           
            req.session.cart = req.session.cart.filter(item => item._id !== productId);
        }

        res.status(200).send({ message: "Item removed successfully." });
    };


    exports.searchProducts = async (req, res) => {
        try {
            const { query } = req.body;

           
            if (!query || query.trim() === "") {
                return res.redirect("/clientdashboard"); 
            }

           
            const products = await Product.find({
                $or: [
                    { name: { $regex: query, $options: "i" } }, 
                    { category: { $regex: query, $options: "i" } }
                ]
            });

            res.render("clientdashboard", { 
                user: req.user,
                products: products,
                cart: req.session.cart || [] 
            });
        } catch (err) {
            console.error("Error searching for products:", err);
            res.status(500).send("An error occurred while searching for products.");
        }
    };
    exports.editQuantity = async (req, res) => {
        try {
            const productId = req.query.productId;

            
            const cartItem = req.session.cart.find((item) => item._id === productId);
            if (!cartItem) {
                return res.status(404).send("Product not found in cart.");
            }

            const product = await Product.findById(productId);

            res.render("editQuantity", { 
                product: product, 
                quantity: cartItem.quantity 
            });
        } catch (err) {
            console.error("Error rendering edit quantity page:", err);
            res.status(500).send("An error occurred.");
        }
    };
    exports.updateQuantity = (req, res) => {
        try {
            const { productId, quantity } = req.body;

           
            if (!req.session.cart) {
                return res.status(400).send("Cart not found.");
            }

           
            req.session.cart = req.session.cart.map((item) => {
                if (item._id === productId) {
                    return { ...item, quantity: parseInt(quantity, 10) };
                }
                return item;
            });

            res.redirect("/viewCart"); 
        } catch (err) {
            console.error("Error updating quantity:", err);
            res.status(500).send("An error occurred while updating the quantity.");
        }
    };
    exports.checkout = (req, res) => {
        try {
            const selectedItems = req.body.selectedItems; // Array of selected item IDs
            if (!selectedItems || selectedItems.length === 0) {
                return res.status(400).send("No items selected for checkout.");
            }
    
            const cart = req.session.cart || [];
            const selectedProducts = cart.filter((item) => selectedItems.includes(item._id));
    
            if (selectedProducts.length === 0) {
                return res.status(400).send("Selected items are not in the cart.");
            }
    
            req.session.checkoutItems = selectedProducts;
            res.redirect("/order-summary");
        } catch (err) {
            console.error("Error during checkout:", err);
            res.status(500).send("An error occurred during checkout.");
        }
    };
    
    exports.orderSummary = async (req, res) => {
        try {
            const checkoutItems = req.session.checkoutItems || [];
            if (checkoutItems.length === 0) {
                return res.redirect("/viewCart");
            }

            
            const userId = req.session.user.id; 

            
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).send("User not found.");
            }

           
            const shippingFee = 50; // PHP
            const totalAmount = checkoutItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ) + shippingFee;

           
            res.render("orderSummary", {
                userName: user.name,  
                userEmail: user.email,    
                userAddress: user.address,
                items: checkoutItems,
                shippingFee: shippingFee,
                totalAmount: totalAmount,
            });
        } catch (err) {
            console.error("Error rendering order summary:", err);
            res.status(500).send("An error occurred while rendering the order summary.");
        }
    };
    
    exports.viewClientOrders = async (req, res) => {
        try {
            const userEmail = req.user?.email || req.session?.user?.email;
    
            if (!userEmail) {
                return res.status(400).send("Email not found. Please ensure you're logged in.");
            }
    
            // Fetch orders excluding those with status "Delivered"
            const orders = await Order.find({ email: userEmail, status: { $ne: "Delivered" } }).sort({ createdAt: -1 });
    
            res.render("myOrder", {
                orders: orders, // Pass filtered orders to the view
            });
        } catch (err) {
            console.error("Error fetching client orders:", err);
            res.status(500).send("An error occurred while retrieving your orders.");
        }
    };
    exports.viewDeliveredOrders = async (req, res) => {
        try {
            const userEmail = req.user?.email || req.session?.user?.email;
    
            if (!userEmail) {
                return res.status(400).send("Email not found. Please ensure you're logged in.");
            }
    
            // Fetch orders with the status "Delivered"
            const deliveredOrders = await Order.find({ email: userEmail, status: "Delivered" }).sort({ createdAt: -1 });
    
            res.render("orderHistory", {
                orders: deliveredOrders, // Pass only delivered orders to the view
            });
        } catch (err) {
            console.error("Error fetching delivered orders:", err);
            res.status(500).send("An error occurred while retrieving your delivered orders.");
        }
    };
    
    