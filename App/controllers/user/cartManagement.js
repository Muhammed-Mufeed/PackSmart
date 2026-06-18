const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')
const Offer = require('../../models/offerSchema')
const Wishlist = require('../../models/wishlistSchema')


// =========================================================AddtoCart-POST===================================================//

exports.postAddtoCart = async (req,res,next)=>{
  try {

    const { productId, variantId, fromWishlist } = req.body;
    const userId = req.session.user.id
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    if (variant.stock <= 0) {
      return res.status(400).json({ success: false, message: "Out of stock" });
    }

    
    let cart = await Cart.findOne({user: userId})

   
    if(!cart){
      cart = new Cart({user: userId , items:[]})
    }

    
    const existingItem = cart.items.find( (item) => item.product.toString() === productId && item.variant.toString() === variantId) 

    if(existingItem){

      if (existingItem.quantity + 1 > variant.stock) {
        return res.status(400).json({ success: false, message: "Insufficient stock" });
      }
      
      existingItem.quantity += 1;       
    
    }
    else{
      cart.items.push({product:productId ,variant:variantId ,quantity:1})  // If item does not exist, add it to the cart
    }

    await cart.save()
      if (fromWishlist) {
        const wishlist = await Wishlist.findOne({ user: userId });
        if (wishlist) {
            const itemIndex = wishlist.items.findIndex(
                (item) => item.product.toString() === productId && item.variant.toString() === variantId
            );
            if (itemIndex > -1) {
                wishlist.items.splice(itemIndex, 1);
                await wishlist.save();
            }
        }
    }
    
    return res.status(200).json({success:true,message:"Item added to the Cart"})

  } catch (error) {
    next(error);
  }
}

// =========================================================CartPage-GET============================================================//
exports.getCartPage = async (req, res, next) => {
  try {

    if (!req.session.user) {
      return res.redirect('/login'); 
    }

    const userId = req.session.user.id;

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        populate: [
          { path: 'category', match: { isListed: true } }, // Only listed categories
          { path: 'brand', match: { isListed: true } },    // Only listed brands
        ],
      });

    if (!cart) {
      return res.render('user-cart', { cartItems: [], subtotal: 0 });
    }

    const categoryOffers = await Offer.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() }
    });
    // Creating a Discount Lookup Object
    const categoryDiscounts = {};
    categoryOffers.forEach((offer) => {
      categoryDiscounts[offer.categoryId.toString()] = offer.categoryDiscount;
    });

    let subtotal = 0;

    // Fetch the correct variant and apply discount
    const cartItems = cart.items.map((item) => {
      const product = item.product;
      if (!product || !product.isListed || !product.category || !product.brand) {
        return null;
      }
      const variant = product.variants.id(item.variant); 
      
      if (!variant || !variant.isListed) {
        return null;
      }

      // Get product and category discounts
      const productOffer = product.productDiscount || 0;
      const categoryOffer = categoryDiscounts[product.category.toString()] || 0;

      
      const maxDiscount = Math.max(productOffer, categoryOffer);

      // Calculate the discounted price
      const discountedPrice = Math.round(product.actualPrice - (product.actualPrice * maxDiscount) / 100);

      subtotal += discountedPrice * item.quantity;

      return {
        product: {
          ...product.toObject(),
          sellingPrice: discountedPrice, // Changed selling price
        },
        variant,
        quantity: item.quantity,
      };
    }).filter((item) => item !== null);

    return res.render('user-cart', { cartItems, subtotal });

  } catch (error) {
    next(error);
  }
};


// =========================================================UpdateCartPage-POST============================================================//
exports.putUpdateCartPage = async (req,res,next)=>{
  try {

    const {productId,variantId,quantity} = req.body
    const userId = req.session.user.id


    // Fetch the product and variant to check stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found." });
    }

    // Check if the requested quantity exceeds the stock
    if (quantity > variant.stock) {
      return res.status(400).json({success:false,message:`Insufficient stock for ${product.name} ${variant.colorName} color.` })
    } 

    const cart = await Cart.findOne({user:userId})

    if(!cart){
      return res.status(404).json({success:false, message:"Cart not found."})
    }

    // Find the item in the cart
    const item = cart.items.find(
      (item) => item.product.toString() === productId && item.variant.toString() === variantId
    )

    if(item){
     
      // Update the quantity
      item.quantity = quantity;
      await cart.save()

      return res.status(200).json({success:true,message:"Cart updated.",stock:variant.stock})
    }
    else{
      return res.status(404).json({success:false, message:"Item not found in cart"})
    }

  } catch (error) {
    next(error);
  }
}

// =========================================================RemovCartPage-POST============================================================//

exports.deleteRemoveCart = async(req,res,next) => {
  try {
    const{productId,variantId} = req.body
    const userId = req.session.user.id

    const removedCart = await Cart.findOneAndUpdate(
      {user:userId},
      {$pull: {items: {product: productId, variant: variantId} } },
      {new:true}
    );

    if(!removedCart){
      return res.status(404).json({success:false, message:" Cart not found "})
    }

    //If cart is empty after removal , just deleting it
    if(removedCart.items.length === 0){
      await Cart.deleteOne({ user: userId})
      return res.json({success:true , message: " Item removed and cart deleted "})
    }

    return res.json({success:true, message:"Item removed from the cart"})
  } catch (error) {
    next(error);
  }
}

// =========================================================checkOut-POST============================================================//

exports.postCartTocheckout = async (req,res,next) => {
  try {
    const userId = req.session.user.id;
    
    // Fetch the latest cart data
    const cart = await Cart.findOne({user: userId}).populate('items.product')

    if(!cart){
      return res.status(404).json({success:false, message:"Cart Items not found.please add Items in to the cart "})
    }

    
    for(const item of cart.items){
      const product = item.product;
      const variant = product.variants.id(item.variant)

      if(item.quantity > 5){
        return res.status(400).json({success:false,message:'You cannot buy more than 5 units of a single product.'})
      }

      if(!variant || variant.stock < item.quantity){
        return res.status(400).json({success:false,message:`Insufficient stock for ${product.name} ${variant.colorName} color.` })
      }
    }

    return res.status(200).json({success:true,message:'Proceed to checkout'})
  } catch (error) {
    next(error);
  }
}