const express= require("express")
const {json}= require('express')
const app= express()

app.use(json())
app.use('/scrap', router)


 app.listen(80, ()=>{
    console.log("Server is running on port 80")
 })