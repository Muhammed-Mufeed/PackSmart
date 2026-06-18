const express=require('express')
const session = require('express-session')
const path=require('path')
const nocache = require('nocache');
const env=require("dotenv").config()
const  mongoDB=require("./config/db")
 mongoDB()
 const passport = require('./config/passport')

const userRoutes=require('./routes/userRoutes')
const adminRoutes=require('./routes/adminRoutes');
const setUserData = require('./middlewares/sessionAuth');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');

const app=express()

app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])


app.use(express.json())
app.use(express.urlencoded({extended:true}))



app.use(nocache());


app.use(session({
 secret: process.env.SESSION_SECRET,
 resave: false,
 saveUninitialized: true,
 cookie: {
  secure:false,
  httpOnly:true,
  maxAge:72*60*60*1000     //(72 hrs)
 }
}))

//GoogleAuth:
app.use(passport.initialize())   //Initializes Passport, which is a middleware for authentication.    
app.use(passport.session())      // Integrates Passport with session-based authentication.


app.use(express.static(path.join(__dirname,'public')))


app.use('/admin',adminRoutes)
app.use('/',setUserData,userRoutes)

app.use(notFoundHandler);

app.use(errorHandler);




app.listen(process.env.PORT,()=>{
  console.log(`app is listening at http://localhost:${process.env.PORT}`)
})

module.export=app