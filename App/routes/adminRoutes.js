  const express = require('express')
  const router = express.Router()
  const adminController = require('../controllers/admin/adminController')
  const customerManagement = require('../controllers/admin/customerManagement')
  const categoryManagement = require('../controllers/admin/categoryManagement')
  const productManagement = require('../controllers/admin/productManagement')
  const brandManagement = require('../controllers/admin/brandManagement')
  const orderManagement = require('../controllers/admin/orderManagement')
  const offerManagement = require('../controllers/admin/offerManagement')
  const couponManagement = require('../controllers/admin/couponManagement')
  const salesManagement = require('../controllers/admin/salesManagement')
  const walletController = require('../controllers/admin/walletManagement')


  const{checkLogin,checkLogout} = require('../middlewares/adminAuth')
  const {uploadCategoryImage, uploadProductImage}= require("../middlewares/multer");

  // ==================================================================================================================//
  router.get('/login', checkLogout, adminController.getAdminLogin)
  router.post('/login', adminController.postAdminLogin)
  router.post('/logout',  adminController.postAdminLogout)
  // ==================================================================================================================//
  router.get('/dashboard',checkLogin, salesManagement.getSalesDashboard);
  router.get('/chart-data',checkLogin, salesManagement.getChartData); // New route for chart data
  router.get('/dashboard/download',checkLogin, salesManagement.downloadSalesReport);

  // ==================================================================================================================//
  router.get('/customers',checkLogin,customerManagement.getuserManagement)
  router.patch('/customers/:userId/update-status',customerManagement.patchUpdateUserStatus)
  // ==================================================================================================================//
  router.get('/categories',checkLogin,categoryManagement.getCategoryManagement)
  router.get('/categories/add',checkLogin,categoryManagement.getAddCategory)
  router.post('/categories/add',uploadCategoryImage.single('image'),categoryManagement.postAddCategory)
  router.get('/categories/edit/:id',checkLogin,categoryManagement.getEditCategory)
  router.put('/categories/edit/:id',uploadCategoryImage.single('image'),categoryManagement.putEditCategory)
  router.patch('/categories/:categoryId/update-CategoryStatus',categoryManagement.patchUpdateCategoryStatus)
  // ==================================================================================================================//
  router.get('/products',checkLogin,productManagement.getProductManagement)
  router.get('/products/add',checkLogin,productManagement.getAddProduct)
  router.post('/products/add',productManagement.postAddProduct)
  router.get('/products/edit/:id',checkLogin,productManagement.getEditProduct)
  router.put('/products/edit/:id',productManagement.putEditProduct)
  router.patch('/products/:productId/update-ProductStatus',productManagement.patchUpdateProductStatus)

  router.get('/products/:productId/variants',checkLogin,productManagement.getVariantsManagement)
  router.get('/products/:productId/variants/add',checkLogin,productManagement.getAddVariants)
  router.post('/products/:productId/variants/add',uploadProductImage.array('images',3),productManagement.postAddVariants)
  router.get('/products/:productId/variants/:variantId/edit',checkLogin,productManagement.getEditVariants)
  router.put('/products/:productId/variants/:variantId/edit',uploadProductImage.array('images',3),productManagement.putEditVariants)
  router.patch('/products/:productId/variants/:variantId/update-VariantStatus',productManagement.patchUpdateVariantStatus)
 

  // ==================================================================================================================//
  router.get('/brands', checkLogin, brandManagement.getBrandManagement);
  router.get('/brands/add', checkLogin, brandManagement.getAddBrand);
  router.post('/brands/add', brandManagement.postAddBrand);
  router.get('/brands/edit/:id',checkLogin, brandManagement.getEditBrand);
  router.put('/brands/edit/:id', brandManagement.putEditBrand);
  router.patch('/brands/:brandId/update-BrandStatus',brandManagement.patchUpdateBrandStatus);
  // ==================================================================================================================//
  router.get('/orders',checkLogin,orderManagement.getOrderListPage)
  router.get('/orders/:orderId',checkLogin,orderManagement.getOrderDetailspage)
  router.patch('/orders/:orderId/items/:itemId/update-status',checkLogin,orderManagement.updateOrderStatus)
  router.patch('/orders/:orderId/items/:itemId/approve-return', checkLogin, orderManagement.approveReturn);
router.patch('/orders/:orderId/items/:itemId/reject-return', checkLogin, orderManagement.rejectReturn);
  // ==================================================================================================================//
  router.get('/offers',checkLogin,offerManagement.getCategoryOffers)
  router.get('/offers/add',checkLogin,offerManagement.getAddCategoryOffer)
  router.post('/offers/add',offerManagement.postAddCategoryOffer)
  router.get('/offers/edit/:id',checkLogin,offerManagement.getEditCategoryOffer)
  router.put('/offers/edit/:id',offerManagement.putEditCategoryOffer)
  router.patch('/offers/:id/update-offerStatus',offerManagement.patchUpdateOfferStatus)
   // ==================================================================================================================//
  router.get('/coupons',checkLogin,couponManagement.getCoupons)
  router.get('/coupons/add',checkLogin,couponManagement.getAddCoupon)
  router.post('/coupons/add',couponManagement.postAddCoupon)
  router.get('/coupons/edit/:id',checkLogin,couponManagement.getEditCoupon)
  router.put('/coupons/edit/:id',couponManagement.putEditCoupon)
  router.patch('/coupons/:id/update-Couponstatus',couponManagement.patchUpdateCouponStatus)


  router.get('/wallets', walletController.getWalletTransactionsPage);
  router.get('/wallet/transaction/:id', walletController.getTransactionDetails);


   // ==================================================================================================================//

  module.exports = router