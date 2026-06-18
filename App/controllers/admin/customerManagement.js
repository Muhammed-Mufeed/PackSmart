const User = require('../../models/userSchema')


// ===============================================CustomerManagement-GET===================================================================//
exports.getuserManagement = async (req,res,next)=>{
try {
    

   const page = parseInt(req.query.page) || 1;
   const limit = 5;
   const search = req.query.search || '';

   
   const searchFilter ={ 
    $or:[
      {name: {$regex: search, $options: 'i'}}, 
      {email: {$regex: search, $options: 'i'}}
     ] 
   }
   
     
    const totalUsers = await User.countDocuments({isAdmin:false,...searchFilter})                               


    const totalPages = Math.ceil(totalUsers / limit)  
  
   
    const users = await User.find({isAdmin:false,...searchFilter})
     .skip( (page - 1)* limit) 
     .limit(limit)            
     .sort({createdAt : 1})   

  
  res.render('customers',{users,currentPage:page,totalPages,search})

   
} catch (error) {
   next(error);
}
}

// ===============================================UpdateUserStatus-PATCH===================================================================//


exports.patchUpdateUserStatus = async (req,res,next)=>{
  try {
    const userId = req.params.userId
    const user = await User.findById(userId)

    if(!user){
      res.status(404).json({success:false,message:"User not found"})
    }

    user.isBlocked =  !user.isBlocked   
                                           
                                           

    await user.save() 

     const message = user.isBlocked  ? 'The user has been blocked successfully.' : 'The user has been unblocked successfully.';

    res.status(200).json({success:true,isBlocked:user.isBlocked,message})  
  } 

  catch (error) {
    next(error);
  }
}
