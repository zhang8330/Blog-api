let express = require("express");
let crypto = require("crypto");
let {v4} = require("uuid");
let userTable = require("../db/userCount/userTable");
let userDetailTable = require("../db/userDetails/userDetailsTable");
let blogTable = require("../db/blogData/blogTable");

function enCryptData(data, key, alogrithm) {
    if (!crypto.getHashes().includes(alogrithm)) {
        throw new Error("不支持该函数");
    }
    const hmac = crypto.createHmac(alogrithm, key);
    hmac.update(data);
    return hmac.digest("hex");
}

let authenticationApp = express();

authenticationApp.post("/registerUser", function (req, res) {
    console.log("注册接口", req.body);
    let key = v4();//生成一个独一无二的密钥
    let passWord = enCryptData(req.body.passWord, key, "sha256");
    let userName = req.body.userName;
    let myAvatar = req.body.myAvatar;
    let token = enCryptData(v4(), v4(), "sha256");
    userTable.find({
        userName: userName
    }).then(rs => {
        if (rs.length) {
            res.send({
                status: 500,
                message: "该用户名已被使用"
            })
        } else {
            userTable.create({
                userName,
                passWord,
                key,
                token,
                myAvatar,
                isAdmin: false,
                introduction: "",
                approved: false,
                createTime: new Date()
            }).then(() => {
                res.setHeader("Authorization", token);
                res.send({
                    status: 200,
                    message: "注册成功，需等待审核"
                })
            })
            userDetailTable.create({
                key,
                comments: [],
                articles: [],
                likes: [],
                stars: [],
                blacklist: []
            })
        }
    })
});

authenticationApp.post("/loginUser", function (req, res) {
    userTable.find({
        userName: req.body.userName
    }).then(rs => {
        if (rs.length) {
            if (rs[0].passWord === enCryptData(req.body.passWord, rs[0].key, "sha256")) {
                if (rs[0].approved) {
                    res.setHeader("Authorization", rs[0].token);
                    res.send({
                        status: 200,
                        message: "登录成功"
                    })
                } else {
                    res.send({
                        status: 500,
                        message: "该账号正在审核中"
                    })
                }

            } else {
                res.send({
                    status: 500,
                    message: "用户密码错误"
                })
            }
        } else {
            res.send({
                status: 500,
                message: "用户不存在"
            })
        }
    })
});

authenticationApp.get("/checkPermission", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if (rs.length && rs[0].approved) {
            let userDetails = null;
            let views = 0;//我的文章的阅览数
            let likes = 0;//我的文章的点赞数
            await userDetailTable.find({
                key: rs[0].key
            }, {
                key: false,
                _id: false,
                __v: false
            }).then(userDetail => {
                userDetails = userDetail[0];
            });
            await blogTable.find({
                "authorInformation.name": rs[0].userName
            }).then(blogList => {
                blogList.forEach(blogData => {
                    views += blogData.views;
                    likes += blogData.likes;
                })
            })


            res.send({
                status: 200,
                message: "用户识别成功",
                data: {
                    userData: {
                        userName: rs[0].userName,
                        myAvatar: rs[0].myAvatar,
                        introduction: rs[0].introduction,
                        isAdmin: rs[0].isAdmin,
                        userDetails,
                        views,
                        likes

                    }
                }
            })

        } else {
            res.send({
                status: 500,
                message: "用户识别失败"
            })
        }
    })
});

authenticationApp.post("/updateUserInfo", function (req, res) {
    userTable.updateOne({
        token: req.headers.authorization
    }, {
        $set: {
            myAvatar: req.body.myAvatar,
            introduction: req.body.introduction
        }
    }).then(async rs => {
        res.send({
            status: 200,
            message: "用户信息更新"
        })
    })
});

authenticationApp.get("/unapprovedUser", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if (rs.length && rs[0].isAdmin) {
            let {offset, limit} = req.query;//获取参数
            let totalNum = 0;
            await userTable.find({
                approved: false
            }).then(unapprovedUsers => {
                totalNum = unapprovedUsers.length;//获取未授权用户的数量

            })
            userTable.find({
                approved: false
            }, {
                _id: false,
                __v: false
            }, {
                skip: Number(offset),
                limit: Number(limit)
            }).then(unapprovedUsers => {
                totalNum = unapprovedUsers.length;//获取未授权用户的数量
                res.send({
                    status: 200,
                    message: "查询成功",
                    data: {
                        totalNum,
                        userList: unapprovedUsers
                    }
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.get("/unAllUser", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if (rs.length && rs[0].isAdmin) {
            let {offset, limit} = req.query;//获取参数
            let totalNum = 0;
            await userTable.find({}).then(unapprovedUsers => {
                totalNum = unapprovedUsers.length;//获取未授权用户的数量

            })
            userTable.find({}, {
                _id: false,
                __v: false
            }, {
                skip: Number(offset),
                limit: Number(limit)
            }).then(unapprovedUsers => {
                totalNum = unapprovedUsers.length;//获取未授权用户的数量
                res.send({
                    status: 200,
                    message: "查询成功",
                    data: {
                        totalNum,
                        userList: unapprovedUsers
                    }
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.post("/approvedUser", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if (rs.length && rs[0].isAdmin) {
            userTable.updateOne({
                key: req.body.key
            }, {
                $set: {
                    approved: true
                }
            }).then(() => {
                res.send({
                    status: 200,
                    message: "批准注册"
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.post("/deleteUser", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if (rs.length && rs[0].isAdmin) {
            await userTable.find({
                key: req.body.key
            }).then(userInfos => {
                blogTable.deleteMany({
                    "authorInformation.name": userInfos[0].userName
                }).then(() => {
                    console.log("删除用户的博客数据");
                })
            })
            await userDetailTable.deleteOne({
                key: req.body.key
            }).then(() => {
                console.log("删除用户的详细数据");
            })
            await userTable.deleteOne({
                key: req.body.key
            }).then(() => {
                res.send({
                    status: 200,
                    message: "删除用户成功"
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.post("/setAdmin", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(rs => {
        if (rs.length && rs[0].isAdmin) {
            userTable.updateOne({
                key: req.body.key
            }, {
                $set: {
                    isAdmin: true
                }
            }).then(userInfos => {
                res.send({
                    status: 200,
                    message: "更改用户权限成功"
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.post("/cancelAdmin", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(rs => {
        if (rs.length && rs[0].isAdmin) {
            userTable.updateOne({
                key: req.body.key
            }, {
                $set: {
                    isAdmin: false
                }
            }).then(userInfos => {
                res.send({
                    status: 200,
                    message: "更改用户权限成功"
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.post("/unApprovedUser", function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if (rs.length && rs[0].isAdmin) {
            userTable.updateOne({
                key: req.body.key
            }, {
                $set: {
                    approved: false
                }
            }).then(() => {
                res.send({
                    status: 200,
                    message: "批准注册"
                })
            })
        } else {
            res.send({
                status: 401,
                message: "没有操作权限"
            })
        }
    })
});

authenticationApp.get('/userRegisterInfo', function (req, res){
    userTable.find({
        token: req.headers.authorization
    }).then((rs)=>{
        if (rs.length && rs[0].isAdmin){
            userTable.find({},{
                createTime: true
            }).then((userInfo)=>{
                res.send({
                    status: 200,
                    data: {
                        userInfo
                    }
                })
            })
        }else{
            res.send({
                status: 401,
                message: '没有操作权限'
            })
        }
    })
});
module.exports = {
    authenticationApp
}