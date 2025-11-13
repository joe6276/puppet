const {Router}= require("express")
const {  getScrapped, getDetailedScrapped } = require("../controller")


const puppetRouter = Router()


puppetRouter.post("", getScrapped)
puppetRouter.post("/detailed", getDetailedScrapped)


module.exports={puppetRouter}
