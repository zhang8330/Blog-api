let express = require("express");
let userTable = require("../db/userCount/userTable");
let userDetailsTable = require("../db/userDetails/userDetailsTable");
let blogTable = require("../db/blogData/blogTable");

let userDetailsApp = express();

userDetailsApp.post('/likes', function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async (rs) => {
        await blogTable.updateOne({
            blogId: req.body.blogId
        }, {
            $inc: {
                likes: 1
            }
        }).then(() => {
            console.log('有人给博客点赞');
        })

        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $push: {
                likes: req.body.blogId
            }
        }).then(() => {
            res.send({
                status: 200,
                message: '点赞成功'
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: '点赞失败'
            })
        })
    })
})

userDetailsApp.delete('/likes/:id', function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async (rs) => {
        await blogTable.updateOne({
            blogId: Number(req.params.id)
        }, {
            $inc: {
                likes: -1
            }
        }).then(() => {
            console.log('有人给博客取消点赞');
        })

        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $pull: {
                likes: Number(req.params.id)
            }
        }).then(() => {
            res.send({
                status: 200,
                message: '取消点赞成功'
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: '取消点赞失败'
            })
        })
    })
})

userDetailsApp.post('/star', function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async (rs) => {
        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $push: {
                stars: req.body.userName
            }
        }).then(() => {
            res.send({
                status: 200,
                message: '关注成功'
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: '关注失败'
            })
        })
    })
})

userDetailsApp.delete('/star/:userName', function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async (rs) => {
        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $pull: {
                stars: req.params.userName
            }
        }).then(() => {
            res.send({
                status: 200,
                message: '取消关注成功'
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: '取消关注失败'
            })
        })
    })
})

userDetailsApp.post('/blacklist', function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async (rs) => {
        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $push: {
                blacklist: req.body.userName
            }
        }).then(() => {
            res.send({
                status: 200,
                message: '关注成功'
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: '关注失败'
            })
        })
    })
})

userDetailsApp.delete('/blacklist/:userName', function (req, res) {
    userTable.find({
        token: req.headers.authorization
    }).then(async (rs) => {
        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $pull: {
                blacklist: req.params.userName
            }
        }).then(() => {
            res.send({
                status: 200,
                message: '取消关注成功'
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: '取消关注失败'
            })
        })
    })
})

userDetailsApp.get("/comments", function (req, res) {
    let {offset, limit} = req.query;
    userTable.find({
        token: req.headers.authorization
    }).then((rs) => {
        if (rs.length) {
            userDetailsTable.find({
                key: rs[0].key
            }).then((comments) => {
                let commentsList = comments[0].comments.slice(offset, limit + offset);
                res.send({
                    status: 200,
                    message: '获取评论成功',
                    data: {
                        commentsList,
                        totalNum: comments[0].comments.length
                    }

                })
            }).catch(err => {
                res.send({
                    status: 500,
                    message: '获取评论失败'
                })
            })
        }
    })
})

userDetailsApp.get("/star", function (req, res) {
    let {offset, limit} = req.query;
    userTable.find({
        token: req.headers.authorization
    }).then((rs) => {
        if (rs.length) {
            userDetailsTable.find({
                key: rs[0].key
            }).then((stars) => {
                let starsList = stars[0].stars.slice(offset, limit + offset);
                userTable.find({
                    userName: {
                        $in: starsList
                    }
                }, {
                    userName: true,
                    myAvatar: true,
                    introduction: true
                }).then(rs => {
                    res.send({
                        status: 200,
                        message: '获取关注成功',
                        data: {
                            starsList: rs,
                            totalNum: stars[0].stars.length
                        }

                    })
                })

            }).catch(err => {
                res.send({
                    status: 500,
                    message: '获取关注失败'
                })
            })
        }
    })
});

userDetailsApp.get("/blacklist", function (req, res) {
    let {offset, limit} = req.query;
    userTable.find({
        token: req.headers.authorization
    }).then((rs) => {
        if (rs.length) {
            userDetailsTable.find({
                key: rs[0].key
            }).then((blacklists) => {
                let blacklist = blacklists[0].blacklist.slice(offset, limit + offset);
                userTable.find({
                    userName: {
                        $in: blacklist
                    }
                }, {
                    userName: true,
                    myAvatar: true,
                    introduction: true
                }).then(rs => {
                    res.send({
                        status: 200,
                        message: '获取黑名单成功',
                        data: {
                            blacklist: rs,
                            totalNum: blacklists[0].blacklist.length
                        }

                    })
                })
            }).catch(err => {
                res.send({
                    status: 500,
                    message: '获取黑名单失败'
                })
            })
        }
    })
});
module.exports = {
    userDetailsApp
}