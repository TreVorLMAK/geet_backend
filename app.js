require('dotenv').config()
const express = require('express')
const connectToDatabase = require('./db/database')
const app = express()

connectToDatabase()
app.listen(process.env.PORT, ()=>{
    console.log('Server is running')
    })