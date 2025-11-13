const {Router}= require("express")
const { scrapeURL, scrapeAllPages } = require("../controller")


const puppetRouter = puppetRouter()


puppetRouter.post("", scrapeURL)
puppetRouter.post("/detailed", scrapeAllPages)


module.exports={puppetRouter}