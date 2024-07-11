let express = require("express");
let blogTable = require("../db/blogData/blogTable");
let userTable = require("../db/userCount/userTable");
let userDetailsTable = require("../db/userDetails/userDetailsTable");
let tipOffTable = require("../db/tipOffData/tipOffTable");

let tipOffApp = express();

tipOffApp.post("/article",function (req,res){
    tipOffTable.create({
        blogId:req.body.blogId,
        description:req.body.description,
        cover:req.body.cover,
        title:req.body.title,
        reason:req.body.reason
    }).then(rs =>{
        res.send({
            status:200,
            message:"举报文章成功"
        })
    })
});

tipOffApp.get("/article",async function (req,res){
    let {offset,limit} = req.query;
    let totalNum = 0;
    await tipOffTable.find({}).then(rs=>{
        totalNum = rs.length;
    })
   tipOffTable.find({},{
       __v:false
   },{
       skip:Number(offset),
       limit:Number(limit)
   }).then(rs=>{
       res.send({
           status:200,
           message:"查询成功",
           data:{
               tipOffData:rs,
               totalNum
           }
       })
   })
});

tipOffApp.delete('/tipOffData/:tipOffId',async function (req,res){
    tipOffTable.deleteOne({
        _id: req.params.tipOffId
    }).then(rs=>{
        res.send({
            status: 200,
            message: '删除成功'
        })
    })
});

tipOffApp.delete('/article/:tipOffId',async function (req,res){
    await tipOffTable.find({
        _id: req.params.tipOffId
    }).then(async (rs) => {
        blogTable.deleteOne({
            blogId: rs[0].blogId
        }).then(()=>{
            console.log('删除成功')
        })
    })

    tipOffTable.deleteOne({
        _id: req.params.tipOffId
    }).then(rs=>{
        res.send({
            status: 200,
            message: '删除成功'
        })
    })
});
module.exports = {
    tipOffApp
}