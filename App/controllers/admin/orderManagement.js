const Order = require('../../models/orderSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Wallet = require('../../models/WalletSchema')


// ===============================================OrderListPage-GET===================================================================//


exports.getOrderListPage = async (req, res, next) => {
  try {
   
    const page = parseInt(req.query.page) || 1; 
    const limit = 5; 
    const search = req.query.search || ''; 

    // Search filter

    //Find users whose email matches the search
    const matchingUsers = await User.find({
      email: {$regex: search, $options:'i'}
    }).select('_id') // Only get the user IDs

    const userIds = matchingUsers.map((user) => user._id);
    
    let searchFilter = {}
    if(search){
      searchFilter = {
        $or: [
          {orderId: {$regex: search, $options: 'i'} },
          {user: {$in: userIds} } // Search by user IDs from email matches
        ],
        
      }

    }
    const totalOrders = await Order.countDocuments(searchFilter);

    
    const totalPages = Math.ceil(totalOrders / limit);

    
    const orders = await Order.find(searchFilter)
      .populate('user', 'email')  //Populate user and email from Order 
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit) 
      .limit(limit); 

    
    res.render('orders', {
      orders,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (error) {
    next(error);
  }
};


// ===============================================OrderDetailPage-GET===================================================================//


exports.getOrderDetailspage = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    // Fetch the order and populate product details
    const order = await Order.findOne({ orderId: orderId })
     

    if (!order) {
      return res.status(404).render('error-404');
    }
    
    
    return res.render('orderDetails', { order });
  } catch (error) {
    next(error);
  }
};

// ===============================================UpdateOrderStatus-PATCH===================================================================//
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const {orderId,itemId} = req.params
    const { status } = req.body;

    // Find the order
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const item = order.items.id(itemId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order Item not found.' });
    }


       
    // Validate the status transition
    const isValidStatusChange = (currentStatus, newStatus) => {
      switch (currentStatus) {
          case "Pending":
              return newStatus === "Confirmed";
          case "Confirmed":
              return newStatus === "Shipped";
          case "Shipped":
              return newStatus === "Delivered";
          case "Delivered":
          case "Cancelled":
          case "Returned" :
              return false; // No further updates allowed
          default:
              return false;
      }
    };

    if (!isValidStatusChange(item.status, status)) {     //here fn calling(statusfrom db, status from req.body)   //If the function returns false, it means the transition is not allowed, and we return a 400 Bad Request response.
      return res.status(400).json({ success: false, message: 'Invalid status transition.' });
     }

      // Update the item status
      item.status = status;
      await order.save();

      if (order.paymentMethod === 'cod' && order.paymentStatus === 'Pending') {
        const allDelivered = order.items.every(item => item.status === 'Delivered');
        if (allDelivered) {
          order.paymentStatus = 'Paid';
          await order.save();
        }
      }

   
      return res.status(200).json({ success: true, message: `Item status updated to ${status}.` });
  } catch (error) {
    next(error);
  }
};


// ===============================================ReturnApprove-PATCH===================================================================//

exports.approveReturn = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findOne({ orderId: orderId });

    if (!order){
       return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const item = order.items.id(itemId);

    if (!item || item.return?.status !== 'Requested') {
      return res.status(400).json({ success: false, message: 'Invalid return request.' });
    }

    const product = await Product.findById(item.productId);
    const variant = product.variants.id(item.variantId);
    variant.stock += item.quantity;
    await product.save();

    item.status = 'Returned';
    item.return.status = 'Approved';
    item.return.approvedAt = new Date();

    let wallet = await Wallet.findOne({ user: order.user });

    if (!wallet) {
      wallet = new Wallet({
         user: order.user,
          balance: 0, 
          transactions: []
       });
    }

    const refundAmount =item.product.soldPrice * item.quantity;
     wallet.balance += refundAmount;
     wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: `Refund for returned item (Order #${order.orderId})`,
      orderId: order.orderId,
      itemId: item._id,
    });

    await Promise.all([order.save(), wallet.save()]);
    return res.status(200).json({ success: true, message: 'Return approved and amount credited to wallet.' });
  } catch (error) {
    next(error);
  }
};

// ===============================================Return Cancel-PATCH===================================================================//

exports.rejectReturn = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findOne({ orderId: orderId });
    if (!order){
       return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    
    const item = order.items.id(itemId);
    if (!item || item.return?.status !== 'Requested') {
      return res.status(400).json({ success: false, message: 'Invalid return request.' });
    }

    item.return.status = 'Rejected';
    await order.save();
    return res.status(200).json({ success: true, message: 'Return request rejected.' });
  } catch (error) {
    next(error);
  }
};