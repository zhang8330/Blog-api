let mongoose = require("mongoose");
let Scheme = mongoose.Schema;

let blogItem = new Scheme({
    title:{
        type:String,
        required:true
    },
    tags:{
        type:Array,
        require:true
    },
    description:{
        type:String,
        required:true
    },
    cover:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    comments:{
        type:Array
    },
    authorInformation:{
        type:Object,
        required:true
    },
    lastModifiedTime:{
        type:Date,
        required:true
    },
    views:{
        type:Number,
        required:true
    },
    likes:{
        type:Number,
        required:true
    },
    blogId:{
        type:Number,
        required:true
    },
    approved:{
        type:Boolean,
        required:true
    },
})

const blogTable = mongoose.model("blogTables",blogItem);

module.exports = blogTable;