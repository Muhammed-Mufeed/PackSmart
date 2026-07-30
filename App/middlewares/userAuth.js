const User = require('../models/userSchema')
const Cart = require('../models/cartSchema')


exports.checkLogin = async (req, res, next) => {
  try {
    if (!req.session.user) {
      //For API req, use status code 401.
      return res.status(401).json({ success: false, message: "Unauthorized.Please Login" })   // In checkLogin, we are sending response as json(because we are using fetch for submission).so we are doing like this way.From frontend we are redirecting route('/login)
    }
    else {
      next()
    }
  } catch (error) {
    console.log("Error during user Login Auth", error)
    res.status(500).send("Internal Server Error")
  }

}


exports.checkLogout = async (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect('/')   // Redirect to home if user is already logged in
    }
    else {
      next()
    }
  } catch (error) {
    console.log("Error during user Logout Auth", error)
    res.status(500).send("Internal Server Error")
  }

}


exports.checkBlocked = async (req,res,next)=>{
  try {
    if(!req.session.user){
      return next()  
    }

    
    const currentUser = await User.findById(req.session.user.id)

    
    if (currentUser && currentUser.isBlocked) {
      req.session.destroy((err) => {
          if (err) {
            console.log("Error destroying session:", err);
          }
          return res.redirect('/login?message=Your account has been blocked. Please contact support.');// Redirect to login with message,message is shown in getLogin from req.params
        });
      } 
      else {
        next();
      }
    }
    catch (error) {
    console.log("Error during block check:", error);
    res.status(500).send("Internal Server Error");
    }
 }

exports.loadCartState = async (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const cart = await Cart.findOne({ user: req.session.user.id });
      res.locals.cartProductIds = cart 
        ? cart.items.map(item => `${item.product.toString()}_${item.variant.toString()}`) 
        : [];
    } else {
      res.locals.cartProductIds = [];
    }
    next();
  } catch (error) {
    console.log("Error loading cart state:", error);
    res.locals.cartProductIds = [];
    next();
  }
}