import dotenv from "dotenv"
import connectDB from "./db/db.js";
import app from "./app.js";

dotenv.config({
    path: './.env'
    })
    
connectDB()
.then(() => {

    app.on("error", (error) => {
        console.log("ERROR on app: ", error);
        throw error;
    })
    
    app.listen(process.env.PORT || 8000, () => {
        console.log((`Server is running http://localhost:${process.env.PORT || 8000}`));
    })
})
.catch((err) => {
    console.log("MONGO DB connection failed !!!", err);
})
