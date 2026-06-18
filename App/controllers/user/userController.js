const bcrypt=require('bcrypt')

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY); // Initialize Resend

const User=require('../../models/userSchema')
const Otp = require('../../models/otpSchema')



// ==========================================UserSignup-GET=========================================================================//
const getSignupPage=async(req,res,next)=>{
  try{
    return res.render('signup',{errorMessage:null})
  }
  catch(error){
    next(error);
  }
}


// ===============================================Nodemailer for sending Otp===================================================================//

async function sendVerificationEmail(email, otp, isDemoMode) {
  try {
    console.log(`[Email Attempt] To: ${email} | Demo Mode: ${isDemoMode}`);  

    // Beautifully styled HTML Email Template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #007bff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #ffffff; letter-spacing: 1px;">PackSmart</h2>
        </div>
        <div style="padding: 40px 30px; text-align: center; background-color: #ffffff;">
          <h3 style="margin-top: 0; color: #333333;">Verify Your Account</h3>
          <p style="font-size: 16px; color: #555555; line-height: 1.5;">
            Thank you for choosing PackSmart! Please use the verification code below to complete your authentication process.
          </p>
          <div style="margin: 30px auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px dashed #ced4da; display: inline-block;">
            <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #007bff;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #888888; margin-bottom: 0;">This code will expire in 60 seconds.</p>
          
          ${isDemoMode ? '<p style="font-size: 12px; color: #d32f2f; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;"><i>Note: This is a portfolio demonstration email.</i></p>' : ''}
        </div>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #999999;">
          &copy; ${new Date().getFullYear()} PackSmart. All rights reserved.
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'PackSmart <onboarding@resend.dev>',
      to: email, 
      subject: "PackSmart: Your Verification Code",
      html: htmlTemplate
    });

    if (error) {
      if (isDemoMode) {
        console.error("Resend API blocked the email (Expected in Sandbox):", error.message);
        return true; // Bypass for recruiters
      } else {
        console.error("Failed to send to REAL email:", error.message);
        return false; // Actually fail if it was supposed to go to your real email
      }
    }

    console.log("Email sent successfully via Resend:", data.id);
    return true; 

  } catch (error) {
    console.error("Critical error in sendVerificationEmail:", error);
    return isDemoMode; // If demo mode, keep going. If real mode, fail.
  }
}

// ===============================================UserSignup-POST===================================================================//

const postSignupPage=async(req,res,next)=>{
  try{
  
  const {name,phone,email,password,confirmPassword}= req.body
  
  if(password!==confirmPassword){
   return res.render('signup',{errorMessage:"Password do not match."})
  }

  
  const existingUser= await User.findOne({email})
  if(existingUser){
    return res.render('signup', { errorMessage: 'User with this email already exists.' });

  }
  
  // To generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Check if we are in demo mode (for the UI banner)
    const isDemoMode = email !== process.env.MY_VERIFIED_EMAIL;

    console.log(`[${isDemoMode ? 'Demo' : 'Production'} Mode] Generated OTP: ${otp}`);


 const expiresAt = new Date(Date.now() + 60 * 1000) //OTP expires in 30 seconds

 
 const saveOtp = new Otp({
   otp:otp,
   userId:email,
   expiresAt:expiresAt
 })

  await saveOtp.save()      

  
  const emailSent = await sendVerificationEmail(email,otp,isDemoMode);

  if (!emailSent) {
    return res.json({success:false,message:"Failed to send OTP.Please try again"})
  }
  
   req.session.userData = {name,phone,email,password}

   res.render('verify-otp',{ demoOtp: otp, isDemoMode: isDemoMode })
   
  
}
  catch(error){
   next(error);
  }
}

// ====================================================UserVerifyOTP-POST==============================================================//


const postverifyOtp = async (req,res,next)=>{
  try{
   const {otp} = req.body;
   const {email} = req.session.userData

  // Finding OTP in the database for the given email/userId
   const otpRecord = await Otp.findOne({userId:email, otp:otp})

   if(!otpRecord){
   
    return res.status(400).json({ success: false, message: "Invalid OTP, Please try again."})
   }

   if(otpRecord.expiresAt < new Date()){
    return res.status(400).json({ success: false, message: "OTP has expired.Please request a new one."})
   }

    //OTP is valid, now proceed to hash the password
    const user = req.session.userData
    const passwordHash = await bcrypt.hash(user.password,10)

    const saveUserData = new User({
      name:user.name,
      email:user.email,
      phone:user.phone,
      password:passwordHash  
    })

    await saveUserData.save()  
    
    delete req.session.userData     //Delete userData from session (no longer needed,after saving user)
  
    res.status(200).json({success:true,redirectUrl:"/login"})  
  
  }
  catch(error){
   next(error);
  }
}

// =============================================UserResendOTP-POST=====================================================================//
const postResendOtp = async (req,res,next)=>{
  try{
   const{email} = req.session.userData  
   console.log("Resending Otp to:",email) //debugging
  
   const existingOtp = await Otp.findOne({userId:email}) 

   
   if(existingOtp){
    await Otp.deleteOne({_id:existingOtp._id});
   }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();   // Generate new OTP

  const isDemoMode = email !== process.env.MY_VERIFIED_EMAIL;
  console.log(`[${isDemoMode ? 'Demo' : 'Production'} Mode] Generated OTP: ${otp}`);


   // Set expiration time for the new OTP
   const expiresAt = new Date(Date.now() + 60 * 1000)  

   const newOtpSave = new Otp({
    otp:otp,
    userId:email,
    expiresAt:expiresAt
   })
  
   await newOtpSave.save()  // Save new OTP to the database



   const emailSent = await sendVerificationEmail(email,otp,isDemoMode);

   if(emailSent){
    console.log(`OTP sent(resend) successfully ${otp}`); //debugging
    return res.status(200).json({success:true,message:"OTP Resend Successfully",newDemoOtp: otp,isDemoMode: isDemoMode})
    
   }
   else{
    res.status(500).json({success:false,message:"Failed to resend OTP. Please try again"})
  
    }
  }
  catch(error){
    next(error);
  }
}

// =============================================UserLogin-GET=====================================================================//

const getLoginPage = async (req, res, next) => {
  try {
    const message = req.query.message || null;
    return res.render('login',{errorMessage:message});
  } catch (error) {
     next(error);
  }
};


// ===============================================UserLogin-POST===================================================================//
const postLoginPage = async (req,res,next)=>{
  try{
    const{email,password}=req.body
  
    const findUser = await User.findOne({isAdmin:false,email:email})
  
    if(!findUser){
      return res.render('login',{errorMessage:"User is not found"})
    }

    if(findUser.isBlocked){
      return res.render("login",{errorMessage:"Your account has been blocked. Please contact support."})
    }

   
    const passwordMatch = await bcrypt.compare(password,findUser.password)

    if(!passwordMatch){
      return res.render('login',{errorMessage:" Incorrect Email or password"})
    }

    
    req.session.user={
      id: findUser._id,
      isBlocked:findUser.isBlocked  
    }
    
    return res.redirect('/')
  }

  catch(error){
    next(error);
  }
}

// ===============================================GoogleLogin Callback Fn===================================================================//

const googleLogin = async(req,res,next) => {
  try{
    const user = await User.findById(req.user._id);      // req.user: The authenticated user object from Passport.  // here,~ Access the logged-in user’s Id
    req.session.user = {id:user._id};
    res.redirect('/');
  }
  catch(error){
   next(error);
  }
  
}


// ==================================================UserLogout-POST================================================================//

const postLogoutPage = async (req,res,next)=>{
try {

  req.session.destroy((err)=>{

   if(err){
    console.log("Session Logout error",err.message);
    return next(err);
   }

   else{
     res.redirect('/login')
   }
  }) 

} catch (error) {
  next(error);
}

}



// ==========================================Forgot Password-GET=========================================================================//
const getForgotPasswordPage = async (req, res, next) => {
  try {
    return res.render('forgot-password');
  } catch (error) {
    next(error);
  }
};

// ==========================================Reset Password-POST=========================================================================//
const postResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.render('forgot-password', { errorMessage: "User with this email does not exist." });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const isDemoMode = email !== process.env.MY_VERIFIED_EMAIL;
    console.log(`[${isDemoMode ? 'Demo' : 'Production'} Mode] Generated OTP: ${otp}`);

    const expiresAt = new Date(Date.now() + 60 * 1000); // OTP expires in 1 minute

    const saveOtp = new Otp({
      otp: otp,
      userId: email,
      expiresAt: expiresAt
    });

    await saveOtp.save();

    const emailSent = await sendVerificationEmail(email, otp,isDemoMode);

    if (!emailSent) {
      return res.json({ success: false, message: "Failed to send OTP. Please try again." });
    }

    req.session.userData = {email} ;

    res.render('forgot-verify-otp',{ demoOtp: otp , isDemoMode: isDemoMode });
    console.log("OTP sent successfully", otp);

  } catch (error) {
    next(error);
  }
};

// ==========================================Forgot Verify OTP-GET=========================================================================//
const getForgotVerifyOtpPage = async (req, res, next) => {
  try {
    return res.render('forgot-verify-otp');
  } catch (error) {
    next(error);
  }
};

// ==========================================Forgot Verify OTP-POST=========================================================================//
const postForgotVerifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const { email } = req.session.userData;

    const otpRecord = await Otp.findOne({ userId: email, otp: otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid OTP, Please try again." });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // OTP is valid, redirect to reset password page
    res.status(200).json({ success: true, redirectUrl: "/forgot-confirm-password" });

  } catch (error) {
    next(error);
  }
};

// ==========================================Forgot Confirm Password-GET=========================================================================//
const getForgotConfirmPasswordPage = async (req, res, next) => {
  try {
    return res.render('forgot-reset-password');
  } catch (error) {
    next(error);
  }
};

// ==========================================Forgot Confirm Password-POST=========================================================================//
const postForgotConfirmPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.session.userData;

    if (newPassword !== confirmPassword) {
      return res.render('forgot-reset-password', { errorMessage: "Passwords do not match." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email }, 
      { password: passwordHash },
      {new:true}
    );

    delete req.session.userData;             //Delete userData from session (no longer needed,after saving password)

    return res.status(200).json({ success: true, message: "Password reset successfully. Redirecting to login...", redirectUrl: "/login" });

  } catch (error) {
    next(error);
  }
};


module.exports={
   getSignupPage,
   postSignupPage,
   postverifyOtp,
   postResendOtp,
   getLoginPage,
   postLoginPage,
   postLogoutPage,
   googleLogin,
   getForgotPasswordPage,
   postResetPassword,
   getForgotVerifyOtpPage,
   postForgotVerifyOtp,
   getForgotConfirmPasswordPage,
   postForgotConfirmPassword,
  
  }
