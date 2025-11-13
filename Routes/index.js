const {Router}= require("express")
const { scrapeURL, scrapeAllPages } = require("../controller")


const router = Router()


router.post("", scrapeURL)
router.post("/detailed", scrapeAllPages)


module.exports={router}