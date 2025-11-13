const express= require("express")
const {json}= require('express')
const { puppetRouter } = require("./Routes")
const app= express()

app.use(json())
app.use('/scrap', puppetRouter)


app.get("/test", (req,res)=>{
    res.status(200).send("<h1> Hello Joe !!!! </h1>")
})


 app.listen(80, ()=>{
    console.log("Server is running on port 80")
 })
