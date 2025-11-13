const {Router}= require("express")
const {  getScrapped, getDetailedScrapped } = require("../controller")


const puppetRouter = Router()


puppetRouter.get("", getScrapped)
puppetRouter.get("/detailed", getDetailedScrapped)


module.exports={puppetRouter}