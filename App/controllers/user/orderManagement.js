const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
const Offer = require('../../models/offerSchema')
const Coupon = require('../../models/couponSchema')
const Wallet = require('../../models/WalletSchema')
const Razorpay = require('razorpay')
const crypto = require('crypto');
const env = require('dotenv').config()
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const PDFDocument = require('pdfkit');
const fs = require('fs');


// ===============================================CheckoutPage-POST===================================================================//
 exports.postCheckoutAddaddress = async (req,res,next)=>{
   try {
    const { name, pincode,mobile,locality, address, city, state,  addressType } = req.body;
    const userId = req.session.user.id;

    const newAddress = new Address({
      userId,
      name,
      pincode,
      mobile,
      locality,
      address,
      city,
      state,
      addressType
    });

    await newAddress.save();

    res.status(200).json({ success: true, message: 'Address added successfully.' });
   } catch (error) {
    next(error);
   }
 }
   
 
// ===============================================CheckoutPage-GET===================================================================//

exports.getCheckoutPage = async (req, res, next) => {
  try {

    if(!req.session.user){
      return res.redirect('/login')
    }
    const userId = req.session.user.id;
    
    // Fetch the user's cart and populate product details
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', match: { isListed: true } }, 
          { path: 'brand', match: { isListed: true } },   
        ],
      });
    if (!cart || cart.items.length === 0) {
      return res.redirect('/');     // Redirect to home if it's empty
    }

    const categoryOffers = await Offer.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() }
    });
    
    const categoryDiscounts = {};
    categoryOffers.forEach((offer) => {
      categoryDiscounts[offer.categoryId.toString()] = offer.categoryDiscount
    })


    let subtotal = 0;
    const validCartItems = cart.items
      .map((item) => {
        const product = item.product;
        if (!product || !product.isListed || !product.category || !product.brand) {
          return null;
        }

        const variant = product.variants.id(item.variant);
        if (!variant || !variant.isListed) {
          return null;
        }

        
       
        const productOffer = product.productDiscount || 0;
        const categoryOffer = categoryDiscounts[product.category.toString()] || 0

        const maxDiscount = Math.max(productOffer,categoryOffer)

        const discountedPrice = Math.round(product.actualPrice - (product.actualPrice * maxDiscount) / 100)

        subtotal += discountedPrice * item.quantity;


       
        return {
          product: {
            ...product.toObject(),
            sellingPrice:discountedPrice  //changed Selling Price
          },
          variant,
          quantity: item.quantity,
        };
      })
      .filter((item) => item !== null); 
    if (validCartItems.length === 0) {
      return res.redirect('/cart'); 
    }

    
    const addresses = await Address.find({ userId, isListed: true });
    
    const currentDate = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: currentDate },
      validTo: { $gte: currentDate },
      usageLimit: { $gt: 0 },
      usedBy: { $ne: userId }
    });

   // Fetch wallet balance
   let wallet = await Wallet.findOne({ user: userId });
   if (!wallet) {
     wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
     await wallet.save();
   }
   const walletBalance = wallet.balance;

   res.render('user-checkout', {
     cartItems: validCartItems,
     addresses,
     subtotal,
     coupons,
     user: req.session.user,
     walletBalance, // Pass wallet balance to the template
   });

  } catch (error) {
    next(error);
  }
};



// ===============================================CheckoutPage-POST===================================================================//

exports.postPlaceOrder = async (req,res,next) =>{
  try {
    const userId = req.session.user.id;
    const { addressId, paymentMethod,couponCode } = req.body;

    
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

   
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(400).json({ success: false, message: 'Invalid address.' });
    }

    // Fetch category offers 
    const categoryOffers = await Offer.find({ 
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() }
    });
    
    const categoryDiscounts = {};
    categoryOffers.forEach((offer) => {
      categoryDiscounts[offer.categoryId.toString()] = offer.categoryDiscount;
    });

    
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
        const product = item.product;
        const variant = product.variants.id(item.variant);

      
        if (!product.isListed || !variant || !variant.isListed || variant.stock < item.quantity) {
          throw new Error(`Product "${product.name}" (${variant.colorName}) is out of stock or unavailable.`);
        }

        // Apply product and category discounts 
        const productOffer = product.productDiscount || 0;
        const categoryOffer = categoryDiscounts[product.category.toString()] || 0;
        const maxDiscount = Math.max(productOffer, categoryOffer);
        const discountedPrice = Math.round(product.actualPrice - (product.actualPrice * maxDiscount) / 100);

              
        subtotal += discountedPrice * item.quantity;

      
        return {

        productId: product._id,
        variantId: variant._id,
        product: {
          name: product.name,
          actualPrice: product.actualPrice,
          soldPrice: discountedPrice,
        },

        variant: {
          color: variant.color,
          colorName: variant.colorName,
          images: variant.images
        },

        quantity: item.quantity,
        status: 'Pending'   // Set initial status for each item
        };
    });

    const deliveryCharge = subtotal < 1000 ? 99 : 0;

    let discountAmount = 0;
    let appliedCouponCode = null;
    
    if (couponCode) {
      const coupon = await Coupon.findOne({
        couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() },
        usageLimit: { $gt: 0 },
        usedBy: { $ne: userId }
      });

      if (!coupon) { 
        return res.status(400).json({  success: false,  message: 'Invalid or expired coupon.'});
      }
      
      
      discountAmount = coupon.discountAmount;
      appliedCouponCode = coupon.couponCode;

      coupon.usedBy.push(userId);
      coupon.usageLimit -= 1;
      await coupon.save();
    }

    const finalAmount = Math.max(subtotal - discountAmount + deliveryCharge, 0);

    
    if (paymentMethod === 'online') {
        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
          amount: finalAmount * 100, // Convert to paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        });

        
        const order = new Order({
          user: userId,
          items: orderItems,
          address: {
            name: address.name,
            mobile: address.mobile,
            address: address.address,
            locality: address.locality,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            addressType: address.addressType,
          },
          paymentMethod,
          finalAmount,
          deliveryCharge,
          coupon: {
            couponCode: appliedCouponCode,
            discountAmount: discountAmount,
          },
          paymentStatus: 'Pending', // Save order with "Pending" payment status,after success it becomes "Paid"
          paymentDetails: {
            razorpayOrderId: razorpayOrder.id, // Store Razorpay order ID
          }, 
        });

       const savedOrder = await order.save();

       return res.status(200).json({
        success: true,
        message: 'Order created, proceed to payment.',
        orderId: razorpayOrder.id,
        finalAmount,
        mongoOrderId: savedOrder.orderId,
       });    

    } 
    
    // Handle Wallet Payment
    else if(paymentMethod === 'wallet'){

        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
          return res.status(400).json({ success: false, message: 'Wallet not found.' });
        }

        if (wallet.balance < finalAmount) {
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        const order = new Order({
          user: userId,
          items: orderItems,
          address: {
            name: address.name,
            mobile: address.mobile,
            address: address.address,
            locality: address.locality,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            addressType: address.addressType,
          },
          paymentMethod,
          finalAmount,
          deliveryCharge,
          coupon: {
            couponCode: appliedCouponCode,
            discountAmount: discountAmount,
          },
          paymentStatus: 'Paid', 
        });

        const savedOrder = await order.save();

        // Deduct amount from wallet and add transaction
        wallet.balance -= finalAmount;
        wallet.transactions.push({
          type: 'debit',
          amount: finalAmount,
          description: `Payment for order #${savedOrder.orderId}`,
          orderId: savedOrder.orderId,
        });
        await wallet.save();

        // Reduce stock
        for (const item of cart.items) {
          const product = await Product.findById(item.product._id);
          const variant = product.variants.id(item.variant);
          if (variant) {
            variant.stock -= item.quantity;
            await product.save();
          }
        }

        await Cart.findOneAndDelete({ user: userId });

        return res.status(200).json({
          success: true,
          message: 'Order placed successfully using wallet.',
          redirectUrl: `/orderSuccess/${savedOrder.orderId}`,
        });
    }

    else {
            // COD flow
            const order = new Order({
              user: userId,
              items: orderItems,
              address: {
                name: address.name,
                mobile: address.mobile,
                address: address.address,
                locality: address.locality,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                addressType: address.addressType,
              },
              paymentMethod,
              finalAmount,
              deliveryCharge,
              coupon: {
                couponCode: appliedCouponCode,
                discountAmount: discountAmount,
              },
              paymentStatus: 'Pending', // For COD, payment is pending until delivery
            });

           const savedOrder = await order.save();

         
            for (const item of cart.items) {
              const product = await Product.findById(item.product._id);
              const variant = product.variants.id(item.variant);
              if (variant) {
                variant.stock -= item.quantity;
                await product.save();
              }
            }

            await Cart.findOneAndDelete({ user: userId });

          return res.status(200).json({ success: true,message: 'Order placed successfully.',redirectUrl: `/orderSuccess/${savedOrder.orderId}`,});
        }

  } catch (error) {
    next(error);
  }
};



// ===============================================Online Payment-POST===================================================================//

exports.verifyOnlinePayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (generatedSignature === razorpay_signature) {
      // Payment is valid, update order
      order.paymentStatus = 'Paid';
      order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
      order.paymentDetails.razorpaySignature = razorpay_signature;

     
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock -= item.quantity;
          await product.save();
        }
      }

      // Clear cart
      await Cart.findOneAndDelete({ user: req.session.user.id });
      
      await order.save();

      return res.status(200).json({success: true,message: 'Payment verified and order placed.',redirectUrl: `/orderSuccess/${order.orderId}` });
    } 
    else {
      order.paymentStatus = 'Failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed.',
        redirectUrl: `/userOrders/${order.orderId}`,
      });
    }
  } catch (error) {
    next(error);
  }
};

// ===============================================userOrderSuccessPage-GET===================================================================//
exports.getOrderSuccess = async (req, res, next) => {
  try {

    if(!req.session.user) {
      return res.redirect('/login')
    } 
    
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    
    const order = await Order.findOne({ orderId, user: userId });
    if (!order) {
      return res.status(404).render('page-404');
    }

    return res.render('userOrderSuccess', { orderId: order.orderId });
  } catch (error) {
    next(error);
  }
};

// ===============================================userpaymendFailure-POST===================================================================//
exports.postPaymentFailed = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user.id;

    const order = await Order.findOne({ orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus === 'Pending') {
       order.paymentStatus = 'Failed';
      await order.save();
    }

    return res.status(200).json({ success: true, message: 'Payment failure recorded.' });
  } catch (error) {
    next(error);
  }
};

// ===============================================Retry payment-POST===================================================================//
exports.postRetryPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user.id;

   
    const order = await Order.findOne({ orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentMethod !== 'online' || order.paymentStatus !== 'Failed') {
      return res.status(400).json({
        success: false,
        message: 'Retry is only available for failed online payments.',
      });
    }

    
    const razorpayOrder = await razorpay.orders.create({
      amount: order.finalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `retry_${order.orderId}_${Date.now()}`, // Unique receipt for retry
    });

    
    order.paymentDetails.razorpayOrderId = razorpayOrder.id;
    await order.save();

   
    return res.status(200).json({
      success: true,
      message: 'Retry payment initiated.',
      orderId: razorpayOrder.id, 
      finalAmount: order.finalAmount,
      mongoOrderId: order.orderId, 
    });
  } catch (error) {
    next(error);
  }
};
// ===============================================userOrdersList-GET===================================================================//
exports.getUserOrderList = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user.id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const skip = (page - 1) * limit; 

    const totalOrders = await Order.countDocuments({ user: userId });

    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) 
      .skip(skip) 
      .limit(limit); 

    return res.render('user-orders', {
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    next(error);
  }
};


// ===============================================userOrdersHistory-GET===================================================================//
exports.getUserOrderHistory = async (req, res, next) =>{
  try {

    if(!req.session.user) {
      return res.redirect('/login')
    } 

    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    const order = await Order.findOne({ orderId: orderId, user: userId }); 
    if (!order) {
      return res.status(404).render('page-404');
    }

    return res.render('user-orderDetails', { order,user:req.session.user }); 
    
  } catch (error) {
    next(error);
  }
}

// ===============================================CancelOrder-PATCH===================================================================//

exports.patchCancelItem = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const {reason} = req.body
    const userId = req.session.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const item = order.items.id(itemId); // Use item._id to find the item

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.status === 'Delivered' || item.status === 'Cancelled' || item.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Item cannot be cancelled.' });
    }
    
    // Find the product and variant
    const product = await Product.findById(item.productId)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const variant = product.variants.id(item.variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found.' });
    }

    // Increment the stock of the variant after return 
    variant.stock += item.quantity
    
    await product.save()


    item.status = 'Cancelled';
    item.cancellationReason = reason; // Store the cancellation reason

    if (order.paymentMethod === 'online' || order.paymentMethod === 'wallet') {

        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
          wallet = new Wallet({
            user: userId,
            balance: 0,
            transactions: []
          });
        }
        const refundAmount =item.product.soldPrice * item.quantity;
        wallet.balance += refundAmount;
        wallet.transactions.push({
          type: 'credit',
          amount: refundAmount,
          description: `Refund for cancelled item (Order #${order.orderId})`,
          orderId: order.orderId,
          itemId: item._id,
        });
        
        await wallet.save();
    }


    await order.save();

    return res.status(200).json({ success: true, message: 'Item cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

// ===============================================ReturnOrder-PATCH===================================================================//

// Request Return
exports.patchRequestReturn = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;
    const userId = req.session.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    if (item.status !== 'Delivered' || item.return?.status === 'Requested') {
      return res.status(400).json({ success: false, message: 'Return cannot be requested.' });
    }

    item.return = {
      status: 'Requested',
      reason,
      requestedAt: new Date(),
    };

    await order.save();
    return res.status(200).json({ success: true, message: 'Return request submitted successfully.' });
  } catch (error) {
    next(error);
  }
};


// ===============================================Download Invoice-GET===================================================================//
// ===============================================Download Invoice-GET===================================================================//
exports.getDownloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    // Fetch the order
    const order = await Order.findOne({ orderId: orderId, user: userId }).populate('user');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const doc = new PDFDocument({ margin: 40 });
    const fileName = `invoice_${order.orderId}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.rect(0, 0, 612, 100).fill('#007bff');
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('PackSmart Invoice', { align: 'center', baseline: 'middle', y: 30 });
    doc.fontSize(12).text(`Order #${order.orderId}`, { align: 'center', y: 60 });
    doc.moveDown(2);

    // Reset fill color for body content
    doc.fillColor('#000000');

    // Order Details
    doc.fontSize(16).font('Helvetica-Bold').text('Order Details', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US')}`, 50, doc.y);
    doc.text(`Customer: ${order.user.name}`, 50, doc.y);
    doc.text(`Email: ${order.user.email}`, 50, doc.y);
    doc.moveDown(1.5);

    doc.fontSize(16).font('Helvetica-Bold').text('Shipping Address', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`${order.address.name}`, 50, doc.y);
    doc.text(`${order.address.address}, ${order.address.locality}`, 50, doc.y);
    doc.text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`, 50, doc.y);
    doc.text(`Phone: ${order.address.mobile}`, 50, doc.y);
    doc.moveDown(1.5);

    doc.fontSize(16).font('Helvetica-Bold').text('Items', 50, doc.y);
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 50;
    const mrpX = 230;
    const offerX = 330;
    const qtyX = 430;
    const totalX = 480;
    const rowHeight = 25;
    const tableWidth = 500;

    doc.fillColor('#f5f5f5').rect(50, tableTop, tableWidth, 20).fill();
    doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
    doc.text('Product', itemX + 5, tableTop + 5);
    doc.text('MRP', mrpX + 5, tableTop + 5);
    doc.text('Offer Price', offerX + 5, tableTop + 5);
    doc.text('Qty', qtyX + 5, tableTop + 5);
    doc.text('Total', totalX + 5, tableTop + 5);

    // Table Rows
    let y = tableTop + rowHeight;
    order.items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#fafafa').rect(50, y, tableWidth, rowHeight).fill();
      }
      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      doc.text(`${item.product.name} (${item.variant.colorName})`, itemX + 5, y + 5, { width: 170, align: 'left' });
      doc.text(`₹${item.product.actualPrice.toFixed(2)}`, mrpX + 5, y + 5);
      doc.text(`₹${item.product.soldPrice.toFixed(2)}`, offerX + 5, y + 5);
      doc.text(item.quantity.toString(), qtyX + 5, y + 5);
      doc.text(`₹${(item.product.soldPrice * item.quantity).toFixed(2)}`, totalX + 5, y + 5);
      y += rowHeight;
    });

    // Table Borders
    doc.lineWidth(0.5).strokeColor('#cccccc');
    doc.rect(50, tableTop, tableWidth, y - tableTop).stroke();
    doc.moveTo(mrpX, tableTop).lineTo(mrpX, y).stroke();
    doc.moveTo(offerX, tableTop).lineTo(offerX, y).stroke();
    doc.moveTo(qtyX, tableTop).lineTo(qtyX, y).stroke();
    doc.moveTo(totalX, tableTop).lineTo(totalX, y).stroke();
    for (let i = tableTop + rowHeight; i < y; i += rowHeight) {
      doc.moveTo(50, i).lineTo(50 + tableWidth, i).stroke();
    }

    doc.moveDown(1.5);

    // Order Summary
    doc.fontSize(16).font('Helvetica-Bold').text('Order Summary', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    const subtotal = order.items.reduce((sum, item) => sum + item.product.soldPrice * item.quantity, 0);
    const deliveryCharge = 0; 

    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 50, doc.y);
    if (order.coupon.discountAmount > 0) {
      doc.text(`Coupon Discount (${order.coupon.couponCode}): -₹${order.coupon.discountAmount.toFixed(2)}`, 50, doc.y);
    }
    doc.text(`Delivery Charge: ₹${deliveryCharge.toFixed(2)}`, 50, doc.y);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text(`Final Amount: ₹${order.finalAmount.toFixed(2)}`, 50, doc.y);

    doc.moveDown(1);
    doc.font('Helvetica');
    doc.text(`Payment Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'online' ? 'Online' : 'Wallet'}`, 50, doc.y);
    doc.text(`Payment Status: ${order.paymentStatus}`, 50, doc.y);

    doc.moveDown(2);
    doc.fillColor('#666666').fontSize(8).font('Helvetica').text('Thank you for shopping with PackSmart!', { align: 'center' });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    next(error);
  }
};