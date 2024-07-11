let mongoose = require("mongoose");
let Scheme = mongoose.Schema;

let userDetails = new Scheme({
    key:{
        type:String,
        required:true
    },
    articles:{
        type:Array,
        required:true
    },
    comments:{
        type:Array
    },
    likes:{
        type:Array
    },
    stars:{
        type:Array
    },
    blacklist:{
        type:Array
    }
})

const userDetailsTable = mongoose.model("userDetailsTable",userDetails);

module.exports = userDetailsTable;