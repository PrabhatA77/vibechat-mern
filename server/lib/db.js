import mongoose from "mongoose";

export const connectDB = async ()=>{

    try {

        mongoose.connection.on('connected',()=>console.log("Database connected"))

        await mongoose.connect(`${process.env.MONGO_URI}/vibe-chat`)
    } catch (error) {
        console.log(error);
    }
}
