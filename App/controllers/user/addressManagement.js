const User=require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const bcrypt=require('bcrypt')



// =============================================User-ADDRESS-GET=====================================================================//

exports.getAddressPage = async (req,res,next) =>{
  try {
    if(!req.session.user){
      return res.redirect('/login')
    }

    const userId =  req.session.user.id

    const addresses = await Address.find({userId,isListed:true})
    
    return res.render('user-Address',{addresses})

  } catch (error) { 
    next(error);
  }
}

// =============================================UserAddADDRESS-GET=====================================================================//

exports.getaddAddressPage = async (req,res,next) =>{
  try {
    if(!req.session.user){
      return res.redirect('/login')
    }
    return res.render('user-addAddress')
  } catch (error) {
    next(error);
  }
  
}

// =============================================UserAddADDRESS-POST=====================================================================//

exports.postaddAddress = async (req, res, next) => {
 
  try {

     const { name, pincode, mobile, locality, address, city, state, landmark, addressType } = req.body;
     const userId = req.session.user.id ; 
  
      const newAddress = new Address({
          userId,
          name,
          pincode,
          mobile,
          locality,
          address,
          city,
          state,
          landmark,
          addressType,
      });

      await newAddress.save();

      res.status(200).json({ success: true, message: 'Address added successfully', address: newAddress });
  } catch (error) {
      next(error);
  }
};

// =============================================UserEDITADDRESS-GET=====================================================================//

exports.getEditAddressPage = async (req, res, next) => {

  try {

      if(!req.session.user){
        return res.redirect('/login')
      }

      const addressId = req.params.addressId; 

      const address = await Address.findById(addressId);

      if (!address) {
          return res.status(404).render('page-404');
      }

      return res.render('user-editAddress',{address})
  } catch (error) {
      next(error);
  }
};



// =============================================UserEDITADDRESS-POST=====================================================================//

exports.putUpdateAddress = async (req, res, next) => {
    
    try {

    const addressId = req.params.addressId; 
    const { name, pincode, mobile, locality, address, city, state, landmark, addressType } = req.body;
  
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
          name,
          pincode,
          mobile,
          locality,
          address,
          city,
          state,
          landmark,
          addressType,
      },
      { new: true } // Return the updated document
    );

    if (!updatedAddress) {
        return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, message: 'Address updated successfully', address: updatedAddress });
  } catch (error) {
      next(error);
  }
};


// =============================================UserADDRESS-DELETE=====================================================================//

exports.deleteAddress =  async (req, res, next) => {  
    try {        
        const addressId = req.params.addressId; 

        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            { isListed: false }, 
            { new: true } 
        );

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        res.status(200).json({ success: true, message: 'Address deleted successfully', address: updatedAddress });

    } catch (error) {
        next(error);
    }
};

