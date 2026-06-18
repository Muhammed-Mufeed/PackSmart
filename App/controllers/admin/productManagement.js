const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const Brand = require('../../models/brandSchema')
const  cloudinary  = require('../../config/cloudinary');




// ===============================================productManagement-GET===================================================================//
exports.getProductManagement = async (req,res,next)=>{
  try {
    const page = parseInt(req.query.page) || 1;
    const limit= 4
    const search = req.query.search || ''

    const searchFilter = {
     name:{$regex:search , $options:'i'}
    }

    const totalProducts = await Product.countDocuments(searchFilter)

    const totalPages = Math.ceil(totalProducts / limit)

    const products = await Product.find(searchFilter)
    .skip((page - 1)* limit)
    .limit(limit)
    .sort({createdAt: 1})

    res.render('products',{products,currentPage:page,totalPages,search})

  } catch (error) {
    next(error);
  }
}

// ===============================================AddProduct-GET===================================================================//

exports.getAddProduct = async(req,res,next)=>{
  try {
   const categories = await Category.find({isListed:true})
   const brands = await Brand.find({isListed:true})

   res.render('add-product',{categories,brands}) 
  } catch (error) {
    next(error);
  }
}

// ===============================================AddProduct-GET===================================================================//

exports.postAddProduct = async(req,res,next)=>{
  try {
    const{name,description,category,brand,actualPrice,productDiscount,sellingPrice} = req.body
    
    if(sellingPrice <= 0 || actualPrice <=0){
     return  res.status(400).json({success:false,message:" price must be greater than 0"})
    }
    else if(actualPrice <= sellingPrice){
     return  res.status(400).json({success:false,message:"Selling price must be less than actual price"})
    }
    else if(productDiscount < 0 ){
      return res.status(400).json({success:false,message:"product discount cannot be negative."})
    }

  
    

    const product =  new Product({
      name,
      description,
      category,
      brand,
      actualPrice,
      productDiscount: productDiscount || 0, // Default to 0 if not provided
      sellingPrice 
     
    })

    await product.save()
    return res.status(200).json({success:true,message:"Product added successfully"})


  } catch (error) {
    next(error);
  }
}


// ===============================================EditProduct-GET===================================================================//
exports.getEditProduct = async (req,res,next)=>{
  try {
    const productId = req.params.id

    const product = await Product.findById(productId)

    const categories = await Category.find({isListed:true})
    const brands = await Brand.find({isListed:true})

    if(!product){
      return res.status(404).json({success:false,message:"Product is not Found"})
    }
    return  res.render('edit-product',{product,categories,brands})

  } catch (error) {
   next(error); 
  }
}

// ===============================================EditProduct-PUT===================================================================//
exports.putEditProduct = async(req,res,next)=>{
  try {
    const productId = req.params.id
    const{name,description,category,brand,actualPrice,productDiscount,sellingPrice} = req.body

    if(sellingPrice <= 0 || actualPrice <=0){
      return  res.status(400).json({success:false,message:" price must be greater than 0"})
    }
    else if(actualPrice <= sellingPrice){
      return  res.status(400).json({success:false,message:"Selling price must be less than actual price"})
    }
    else if (productDiscount < 0) {
      return res.status(400).json({ success: false, message: "product Discount Cannot be negative." });
    }


    const existingProduct = await Product.findById(productId)
    if(!existingProduct){
      return res.status(404).json({success:false,message:"Product is not Found"})
    }



    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {name,description,category,brand,actualPrice,productDiscount,sellingPrice},
      {new:true}
    )
    return res.status(200).json({success:true,message:"Product Updated Successfully",product:updatedProduct})

  } catch (error) {
    next(error);

  }
}


// ===============================================UpdateProductStatus-PATCH===================================================================//

exports.patchUpdateProductStatus = async(req,res,next)=>{
  try {
    const productId = req.params.productId
    const product = await Product.findById(productId) 

    if(!product){
      return res.status(404).json({success:false,message:"Product  not found."})
    }

    product.isListed = !product.isListed

    await product.save()
    
    const message = product.isListed ? "The Product Listed Successfully" : "The Product Unlisted successfully"

    return res.status(200).json({success:true,isListed:product.isListed,message})

  } 
  catch (error) {
    next(error);
  }
}

// ===============================================vairantsPage-GET===================================================================//
exports.getVariantsManagement = async (req,res,next)=>{
  try {
    const productId = req.params.productId
   
    const product = await Product.findById(productId)

    if(!product){
      return res.status(404).json({success:false,message:"Product  not Found"})
    }

    
    res.render('variants',{product})
  } catch (error) {
    next(error);
  }
}

// ===============================================AddVariants-GET===================================================================//
exports.getAddVariants = async (req,res,next)=>{
  try {
    const productId = req.params.productId

    const product = await Product.findById(productId)
    return res.render('add-variants',{product})
  } catch (error) {
    next(error);  
  }
}

// ===============================================AddVariants-POST===================================================================//
exports.postAddVariants = async (req, res, next) => {
  try {

    const { color, colorName, stock } = req.body;
    const images = req.files;
    
    const productId = req.params.productId

    const stockValue = parseInt(stock)

    if(stockValue < 0){
      return res.status(400).json({ success:false, message: "Stock cannot be negative."})
    }
    
    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    if (images.length > 3) {
        return res.status(400).json({ success: false, message: 'You can only upload up to 3 images' });
    }

    // Extract Cloudinary URLs from req.files
    const imageUrls = images.map(image => image.path); // `path` contains the Cloudinary URL

    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    
    const variantExists = product.variants.some(variant => variant.color === color );

      if (variantExists) {
          return res.status(400).json({ success: false, message: 'A variant with this color already exists' });
      }
    


    // Create a new variant object
     const newVariant = {
       color,
       colorName,
       stock:stockValue ,
       images: imageUrls
     };

    

    // Push the new variant into the product's variants array
     product.variants.push(newVariant);
     await product.save();

      return res.status(200).json({ success: true, message: "Variant added successfully", product });
  } catch (error) {
     next(error);
  }
};


// ===============================================EditVariants-GET===================================================================//
 exports.getEditVariants  = async (req,res,next) => {
  try {
    const {productId,variantId} = req.params

    const product = await Product.findById(productId)
    if(!product){
     return res.status(404).json({success:false,message:'Product not Found'})
    }

    const variant =  product.variants.id(variantId)
    if(!variant){
     return res.status(404).json({success:false,message:'Variant not Found'})
    }

    return res.render('edit-variants',{product,variant})
  } catch (error) {
    next(error);
  }
 }


// ===============================================EditVariants-POST===================================================================//
exports.putEditVariants = async (req,res,next) =>{

  try {
    const {productId,variantId} = req.params
    const {color,colorName,stock,deletedImages} = req.body
    const images = req.files 
    
    const stockValue = parseInt(stock)
    if (stockValue < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative." });
    }

    if (images.length > 3) {
      return res.status(400).json({ success: false, message: 'You can only upload up to 3 images' });
    }

    const product = await Product.findById(productId)
    if(!product){
      return res.status(404).json({success:false,message:"Product not found."})
    }

    const variant = product.variants.id(variantId)
    if(!variant){
      return res.status(404).json({success:false,message:"Product variant not found."})
    }

    if (!variant.images.length && (!images || images.length === 0)) {
      return res.status(400).json({ success: false, message: "At least one image is required." });
    }
   
   const variantExists = product.variants.some((variant) =>variant._id.toString() !== variantId && variant.color === color)
   if(variantExists){
    return res.status(400).json({success:false,message:'A variant with this color already exists'})
   }

   // Handle image updates
   let updatedImages = [...variant.images];

   if (deletedImages) {
      
      let imagesToDelete = Array.isArray(deletedImages) ? deletedImages : [deletedImages];
      
     
      imagesToDelete.forEach(imageUrl => {
          let index = updatedImages.indexOf(imageUrl);
          if (index !== -1) {
              
              let publicId = imageUrl.split("/").pop().split(".")[0];
              cloudinary.uploader.destroy(`products/${publicId}`);
              
            
              updatedImages.splice(index, 1);
          }
      });
    }

   // Add new images
   if (images && images.length > 0) {
       images.forEach(image => {
           updatedImages.push(image.path);
       });
   }

  
   if (updatedImages.length > 3) {
       return res.status(400).json({ success: false, message: 'Maximum 3 images allowed' });
   }

   if (updatedImages.length === 0) {
       return res.status(400).json({ success: false, message: "At least one image is required." });
   }

   // Update variant
   variant.color = color;
   variant.colorName = colorName;
   variant.stock = stockValue;
   variant.images = updatedImages;

   await product.save();
   return res.status(200).json({ success: true, message: "Variant updated successfully", product });

} catch (error) {
   next(error);
}
};


// ===============================================UpdateVariantStatus-PATCH===================================================================//

exports.patchUpdateVariantStatus = async(req,res,next)=>{
  try {
    const { productId, variantId } = req.params; // Get productId & variantId from request params

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find the variant inside the product's variants array
    const variant = product.variants.id(variantId)

    if(!variant){
    return res.status(404).json({success:false,message:"Variant not Found "})
    }

    variant.isListed = !variant.isListed
    await product.save()

    const message = variant.isListed ? "Variant Listed Successfully" : "Variant Unlisted Successfully"
    return res.status(200).json({success:true,message,isListed:variant.isListed})
       
  } catch (error) {
    next(error);
  }
}