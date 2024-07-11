let mongoose = require("mongoose");
let Scheme = mongoose.Schema;

let userCount = new Scheme({
    userName:{
        type:String,
        required:true
    },
    passWord:{
        type:String,
        required:true
    },
    key:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true
    },
    myAvatar:{
        type:String,
    },
    introduction:{
        type:String
    },
    isAdmin:{
        type:Boolean
    },
    approved:{
        type:Boolean
    },
    createTime:{
        type:Date
    }
})

const userCountTable = mongoose.model("userCountTable",userCount);

module.exports = userCountTable;