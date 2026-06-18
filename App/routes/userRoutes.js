const express = require('express')
const router = express.Router()

const userController = require('../controllers/user/userController')
const userProfileManagement = require('../controllers/user/userProfileManagement')
const productController = require('../controllers/user/productController')
const cartManagement = require('../controllers/user/cartManagement')
const orderManagement = require('../controllers/user/orderManagement')
const addressManagement = require('../controllers/user/addressManagement')



const { checkLogin, checkLogout, checkBlocked } = require('../middlewares/userAuth')
const passport = require('../config/passport')
// ==================================================================================================================//

router.get('/signup', checkLogout, userController.getSignupPage)
router.post('/signup', userController.postSignupPage)
// ==================================================================================================================//

router.post('/verify-otp', userController.postverifyOtp)
router.post('/resend-otp', userController.postResendOtp)
// ==================================================================================================================//

router.get('/login', checkLogout, userController.getLoginPage)
router.post('/login', userController.postLoginPage)
router.post('/logout', userController.postLogoutPage)


router.get('/forgot-password', userController.getForgotPasswordPage);
router.post('/reset-password', userController.postResetPassword);
router.get('/forgot-verify-otp', userController.getForgotVerifyOtpPage);
router.post('/forgot-verify-otp', userController.postForgotVerifyOtp);
router.get('/forgot-confirm-password', userController.getForgotConfirmPasswordPage);
router.post('/forgot-confirm-password', userController.postForgotConfirmPassword);

// ==================================================================================================================//

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), userController.googleLogin);
//Here session auth middleware(no need to give authmiddleware) is present, if loged failed goes to '/login'. else goes to '/'(that callbackFn written in cntrller) 

// ==================================================================================================================//

router.get('/', checkBlocked, productController.getHomepage)
router.get('/userproducts', checkBlocked, productController.getProductspage)
router.get('/categoryProducts/:categoryId', checkBlocked, productController.getCategoryProductspage)
router.get('/productdetail/:id', checkBlocked, productController.getProductDetailPage)

// ==================================================================================================================//
router.get('/userProfile', checkBlocked, userProfileManagement.getUserProfile)
router.get('/changePassword', checkBlocked, userProfileManagement.getChangePassword)
router.put('/changePassword', checkLogin, userProfileManagement.putChangePassword)
router.get('/editUserProfile', checkBlocked, userProfileManagement.getEditUserProfile)
router.put('/editUserProfile', checkLogin, userProfileManagement.putEditUserProfile)

router.get('/userAddress', checkBlocked, addressManagement.getAddressPage)
router.get('/addAddress', checkBlocked, addressManagement.getaddAddressPage)
router.post('/addAddress', checkLogin, addressManagement.postaddAddress)
router.get('/editAddress/:addressId', checkBlocked, addressManagement.getEditAddressPage);
router.put('/editAddress/:addressId', checkLogin, addressManagement.putUpdateAddress);
router.delete('/deleteAddress/:addressId', checkLogin, addressManagement.deleteAddress)

router.get('/userOrders', checkBlocked, orderManagement.getUserOrderList)
router.get('/userOrders/:orderId', checkBlocked, orderManagement.getUserOrderHistory)
router.patch('/userOrders/:orderId/cancelItem/:itemId', checkLogin, orderManagement.patchCancelItem)
router.patch('/userOrders/:orderId/returnItem/:itemId', checkLogin, orderManagement.patchRequestReturn);
router.get('/userOrders/download-invoice/:orderId', checkLogin, orderManagement.getDownloadInvoice);

router.get('/wishlist', checkBlocked, userProfileManagement.getWishlistPage);
router.post('/addToWishlist', checkLogin, userProfileManagement.postaddToWishlist);
router.get('/getWishlistItems', checkBlocked, userProfileManagement.getWishlistItemsStatus);

router.get('/wallet', checkBlocked, userProfileManagement.getWallet);

// ==================================================================================================================//
router.post('/add-to-cart', checkLogin, cartManagement.postAddtoCart)
router.get('/cart', checkBlocked, cartManagement.getCartPage)
router.put('/update-cart', checkLogin, cartManagement.putUpdateCartPage)
router.delete('/remove-cart', checkLogin, cartManagement.deleteRemoveCart)
router.post('/cart', checkLogin, cartManagement.postCartTocheckout)

// ==================================================================================================================//
router.post('/Checkout_addAddress', checkLogin, orderManagement.postCheckoutAddaddress)
router.get('/checkout', checkBlocked, orderManagement.getCheckoutPage)
router.post('/checkout', checkLogin, orderManagement.postPlaceOrder)
router.get('/orderSuccess/:orderId', checkBlocked, orderManagement.getOrderSuccess);
router.post('/verify-Onlinepayment', checkLogin, orderManagement.verifyOnlinePayment);
router.post('/payment-failed', checkLogin, orderManagement.postPaymentFailed);
router.post('/retry-payment', checkLogin, orderManagement.postRetryPayment);

// ==================================================================================================================//

module.exports = router