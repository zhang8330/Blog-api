let path = require("path");
let multer = require("multer");
let express = require("express");
let apiAddress = require("../config/publicPath");
let {v4} = require("uuid");
let uploadImgFileApp = express();

//创建文件存储的配置

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(file);
        if (file.mimetype.includes("image")) {
            cb(null, path.join(__dirname, "../storage/images"));
        }
    },
    filename: function (req, file, cb) {
        cb(null, v4() + file.originalname)
    }
})

let uploadParams = multer({
    storage
})

let uploadConfig = uploadParams.fields([
    {
        name: "blogIllustrations",//对于name为blogIllustrations的input框，设置其上传上限为9
        maxCount: 9
    }
]);

uploadImgFileApp.post("/", uploadConfig, function (req, res) {
    let resData = [];
    for (let i = 0, len = req.files.blogIllustrations.length; i < len; i++) {
        resData.push(`${apiAddress.hostAddress}${apiAddress.getImgApiAddress}/${req.files.blogIllustrations[i].filename}`);
    }
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.send({
        status: 200,
        message: "上传成功",
        data: {
            imgList: resData
        }
    })
})

module.exports = {
    uploadImgFileApp
}