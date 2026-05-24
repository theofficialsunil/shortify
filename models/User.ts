import mongoose,{Schema,model,models} from "mongoose";
import { unique } from "next/dist/build/utils";

const UserSchema = new Schema(
    {
        name:String,
        email:{
            type:String,
            required:true,
            unique:true,
        },
        password:String,
    },
    {timestamps : true}
);

export const User = models.User || model("User",UserSchema);