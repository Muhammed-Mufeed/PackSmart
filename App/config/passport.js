const passport = require('passport')
const GoogleStrategy= require('passport-google-oauth20').Strategy
const  User = require('../models/userSchema');
const env = require('dotenv').config()

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  proxy: true
},

async (accessToken, refreshToken, profile, verifyFn) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if(user){
      return verifyFn(null,user)                    // User already exists; proceed to serialize
    }
    else{
      user = new User({
        name: profile.displayName,   // User's name from Google
        email: profile.emails[0].value,// Primary email from Google
        googleId: profile.id          // Unique Google ID
      })
      await user.save();            // Save the new user in the database
      return verifyFn(null,user)     // Pass user to next step
    }
  }
  
  catch (error) {
     return verifyFn(error,null)   // Handle errors
  }
 
}
));



passport.serializeUser((user,verifyFn)=>{     // Saves user ID into the session
  verifyFn(null,user.id)
})

passport.deserializeUser((id,verifyFn )=>{        // Retrieve user from the database
  User.findById(id)
  .then(user => {
    verifyFn(null,user)
  })
  .catch((error)=>{                             // Handle errors
    verifyFn(error,null)
   })
}) 
 


 module.exports = passport