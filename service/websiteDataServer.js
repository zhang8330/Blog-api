let express = require('express');
let websiteTable = require('../db/webSiteDB/webSiteTable');
let websiteDataApp = express();
websiteDataApp.get('/setVisitorData', async function(req, res){

    console.log("websiteDataServer",res);
    // let data = {
    //     visitTime: resData.visitTime,
    //     province: resData.province,
    //     city: resData.city,
    //     location: resData.rectangle.split(';')[0].split(',')
    // };
    // console.log("websiteDataServer",data);
    // we
    //  bsiteTable.create(data).then(()=>{
    //     res.send({
    //         status: 200,
    //         message: '有人来访问啦'
    //     })
    // })
    res.send({
        status: 200,
        message:"ok"
    })
})

websiteDataApp.get('/websiteData', async function(req, res){
    let {limit,offset} = req.query;
    let totalNum = 0;
    await websiteTable.find({}).then(rs => {
        totalNum = rs.length;
    })

    websiteTable.find({},{
        _id:false
    },{
        skip: Number(offset),
        limit: Number(limit)
    }).then(rs => {
        res.send({
            status: 200,
            message: '查询成功',
            data: {
                websiteData: rs,
                totalNum
            }
        })
    })
})

module.exports = {
    websiteDataApp
}
