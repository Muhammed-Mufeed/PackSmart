const Admin=require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const bcrypt = require('bcrypt')



// ===============================================AdminLogin--GET===================================================================//

 exports.getAdminLogin = async (req,res,next)=>{
  try {   
     return res.render('admin-login',{errorMessage:null})
    }
    
  catch (error) {
    next(error);
  }
}


// ============================================== AdminLogin--POST==================================================================//
exports.postAdminLogin = async (req,res,next)=>{

try {
  const {email,password} = req.body
  const findAdmin =  await Admin.findOne({email,isAdmin:true})

  if(!findAdmin){
    return res.render('admin-login',{errorMessage:"You are not authorized to access this page"})
  }

  const passwordMatch = await bcrypt.compare(password,findAdmin.password)
  if(!passwordMatch){
     return res.render('admin-login',{errorMessage:"Invalid Email or Password"})
  }

  //store admin information in the session
  req.session.admin = {
    id: findAdmin._id,
    isAdmin:true
  }
   res.redirect('/admin/dashboard')
  }
  
  catch (error) {
    next(error);
  }

}

// ===============================================AdminLogout--POST===================================================================//
exports.postAdminLogout = async (req,res,next)=>{
   
   try{
    req.session.destroy((err)=>{
     if(err){
      console.error("Session Logout Error",err)
      return next(err);
     }
     else{
     
       return res.redirect('/admin/login')
      }
    })
  }
  catch(error){
    next(error);
   }

}


