const Category = require('../../models/categorySchema')
const  cloudinary  = require('../../config/cloudinary');

// ====================================================categoryManagement-GET========================================================================//

exports.getCategoryManagement = async (req,res,next)=>{
  try {
   // Get page and search parameters
   const page = parseInt(req.query.page) || 1;
   const limit = 4;
   const search = req.query.search || '';

   //create search Filter
   const searchFilter ={ 
    name: {$regex: search, $options:'i'}
   }
       
    const totalCategories = await Category.countDocuments(searchFilter)    

    const totalPages = Math.ceil(totalCategories / limit)  

    
    const categories = await Category.find(searchFilter)
     .skip( (page - 1)* limit) 
     .limit(limit)             
     .sort({createdAt : 1})   
    
     
     res.render('categories',{categories,currentPage:page,totalPages,search})
  } 
  catch (error) {
    next(error);
  }
}


// ===============================================AddCategory-GET===================================================================//

exports.getAddCategory = (req,res,next)=>{
  try {
    res.render('add-category')
  } catch (error) {
    next(error);
  }
}

// ===============================================AddCategory-POST===================================================================//

exports.postAddCategory = async (req, res, next) => {
  try {
    const{name,description} = req.body

    if(!name || !description){
      return res.status(400).json({success:false,message:"Name and Description are required"})
    }

    if(!req.file){
      return res.status(400).json({success:false,message:"Please upload an Image"})
    }


    const existingCategory = await Category.findOne({
      name:{ $regex: `^${name.trim()}$`,$options:"i" }
    })

    if(existingCategory){
      return res.status(400).json({success:false,message:"Category with this name already exists"})
    }


   
    // **Use the Cloudinary URL from req.file**
    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      image: req.file.path, // This already holds the Cloudinary URL
    });

    await category.save()

    res.status(200).json({success:true, message:"Category added successfully"})

  } catch (error) {
    next(error);
  }
}

// ===============================================EditCategory-GET===================================================================//
exports.getEditCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).render('error-404');
    }

    res.render('edit-category', { category });

} catch (error) {
    next(error);
}
}

// ===============================================EditCategory-PUT===================================================================//

exports.putEditCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    // Backend validation
    if (!name || !description) {
        return res.status(400).json({ success: false, message: 'Name and description are required' });
    }

    // Check for duplicate category name
      const duplicateCategory = await Category.findOne({ 
        name: { $regex: `^${name.trim()}$`, $options: "i" }, 
        _id: { $ne: categoryId } 
      });
      
    if (duplicateCategory) {
        return res.status(400).json({ success: false, message: 'Category name already exists. Please choose another name.' });
    }

    // Find the existing category
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }

    let imageUrl = existingCategory.image; // Keep the existing image by default

    // Handle new image upload
    if (req.file) {
      // **Step 1: Upload new image to Cloudinary**
      imageUrl = req.file.path; // Multer already uploads it to Cloudinary

      // **Step 2: Delete old image from Cloudinary (if it exists)**
      if (existingCategory.image) {
        const oldImagePublicId = existingCategory.image.split("/").pop().split(".")[0]; // Extract public_id
        await cloudinary.uploader.destroy(`categories/${oldImagePublicId}`);
      }
    }

    // **Step 3: Update the category**
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, description, image: imageUrl },
      { new: true }
    );
    

    res.status(200).json({ success: true, message: 'Category updated successfully', category: updatedCategory });
} catch (error) {
    next(error);
}
};
// ===============================================UpdateCategoryStatus-PATCH===================================================================//


exports.patchUpdateCategoryStatus = async (req,res,next)=>{
  try {

    const categoryId =  req.params.categoryId
    const category =  await Category.findById(categoryId)

    if(!category){
      return res.status(404).json({success:false,message:"Category not found"  })
    }


    category.isListed = !category.isListed;

    await category.save()

 
    const message = category.isListed  ? 'The Category Listed successfully.' : 'The Category Unlisted successfully.';
    
    res.status(200).json({success:true,isListed:category.isListed,message})   
    
   }

   catch (error) {
    next(error);
  }
}