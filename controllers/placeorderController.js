const Order = require("../models/Order");
const User = require("../models/User");  
const nodemailer = require("nodemailer");

exports.placeOrder = async (req, res) => {
    try {
       
        const { userName, userEmail, userAddress } = req.body;  
        console.log("Placing order for user:", userEmail);

        const cart = req.session.cart || [];
        if (cart.length === 0) {
            console.error("Cart is empty.");
            return res.status(400).send("Your cart is empty.");
        }

       
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error("User not found.");
            return res.status(404).send("User not found.");
        }

       
        const shippingFee = 50;
        const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0) + shippingFee;

       
        const order = await Order.create({
            user: user._id,
            email: user.email,  
            items: cart,
            totalAmount,
            shippingFee,
        });

        console.log("Order created successfully:", order);

        
        req.session.cart = [];

        
        const transporter = nodemailer.createTransport({
            service: "Gmail", 
            auth: {
                user: "martmacatangay27@gmail.com", 
                pass: "sxiu jqsh buvl kksn", 
            },
        });

       
        const mailOptions = {
            from: "martmacatangay27@gmail.com", 
            to: userEmail,
            subject: "Order Confirmation",
            html: ` 
                <h2>Thank you for your order!</h2>
                <p>Your order has been successfully placed. Here are the details:</p>
                <ul>
                    ${cart
                        .map(
                            (item) => ` 
                                <li> 
                                    <strong>${item.name}</strong><br>
                                    Quantity: ${item.quantity}<br>
                                    Price: ₱${item.price.toFixed(2)}
                                </li>`
                        )
                        .join("")}
                </ul>
                <p><strong>Shipping Fee:</strong> ₱${shippingFee.toFixed(2)}</p>
                <p><strong>Total Amount:</strong> ₱${totalAmount.toFixed(2)}</p>
                <p>We will notify you once your order is shipped!</p>
                <br>
                <p>Thank you for shopping with us!</p>
            `,
        };

       
        await transporter.sendMail(mailOptions);
        console.log("Order confirmation email sent successfully!");

        
        res.status(200).redirect("/cart");
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("An error occurred while placing the order.");
    }
};
