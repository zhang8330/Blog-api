let express = require("express");
let blogTable = require("../db/blogData/blogTable");
let userTable = require("../db/userCount/userTable");
let userDetailsTable = require("../db/userDetails/userDetailsTable");
let {v4} = require("uuid");

let blogApp = express();
blogApp.post("/create", async function (req, res) {
    let newBlog = {
        title: req.body.title,
        tags: req.body.tags,
        description: req.body.description,
        cover: req.body.cover,
        content: req.body.content,
        comments: [],
        authorInformation: {},
        lastModifiedTime: new Date(),
        views: 0,
        likes: 0,
        blogId: 1,
        approved: false
    };
    //生成新的博客id
    await blogTable.find({},
        {
            blogId: true
        },
        {
            sort: {blogId: -1}
        }).then(rs => {
        if (rs.length) {
            newBlog.blogId = rs[0].blogId + 1;
        } else {
            newBlog.blogId = 1;
        }
    })
    //设置博客作者信息
    userTable.find({
        token: req.headers.authorization
    }).then(rs => {
        newBlog.authorInformation = {
            name: rs[0].userName,
            myAvatar: rs[0].myAvatar
        }
        //往用户详情数据里的文章列表里面增加博客id
        userDetailsTable.updateOne({
            key: rs[0].key
        }, {
            $push: {
                articles: newBlog.blogId
            }
        }).then(rs => {
            console.log('更新用户详情数据里面的博客信息')
        })
        //往博客数据表里创建新的文章
        blogTable.create(newBlog).then(rs => {
            console.log("博客创建成功");
            res.send({
                status: 200,
                message: "文章发布成功"
            })
        }).catch(err => {
            res.send({
                status: 500,
                message: "文章发布失败"
            })
        })
    })
});

blogApp.get("/getPublicBlog", async function (req, res) {
    let params = {};
    let {
        offset,
        limit,
        searchKey
    } = req.query;
    //当用户传过来搜索字段时
    if (searchKey) {
        params.title = new RegExp(`${searchKey}`);
    }
    //获取用户的黑名单
    let blackList = [];
    if (req.headers.authorization) {
        //只有登录的用户才有黑名单
        await userTable.find({
            token: req.headers.authorization
        }).then(async (userInfos) => {
            await userDetailsTable.find({
                key: userInfos[0].key
            }).then(userDetails => {
                blackList = userDetails[0].blacklist;
            })
        })
    }

    if (blackList.length) {
        //当用户有拉黑的黑名单的时候
        params["authorInformation.name"] = {
            $nin: blackList//不在该范围的
        }
    } else {

    }
    let totalNum = 0;//博客总数
    await blogTable.find({
        ...params,
        approved:true
    }).then(rs => {
        totalNum = rs.length;//获取总数
    })
    blogTable.find({
        ...params,
        approved:true
    }, {
        content: false,
        _id: false,
        __v: false
    }, {
        skip: Number(offset),
        limit: Number(limit),
        sort: {
            lastModifiedTime: -1
        }
    }).then(blogList => {
        res.send({
            status: 200,
            message: "查询成功",
            data: {
                blogList,
                totalNum
            }
        })
    })
});

blogApp.get("/getBlogDetailById", async function (req, res) {
    let params = {
        blogId: req.query.blogId
    };

    //当有用户请求了某个id的数据时，那么这个id对应的文章的阅览数(views)就加一
    await blogTable.updateOne(
        params,
        {
            $inc: {
                views: 1
            }
        }
    ).then(() => {
        console.log("博客阅览数加一");
    });
    blogTable.find(
        params,
        {
            __v: false,
            _id: false
        }
    ).then(rs => {
        res.send({
            status: 200,
            message: "查询成功",
            data: {
                blogData: rs[0]
            }
        })
    })
});

blogApp.post('/comment/create', function (req, res) {
    let reqData = req.body;
    let commentsData = {
        ...reqData.comments,
        lastModifiedTime: new Date(),
        commentId: v4()
    }
    userTable.find({
        token: req.headers.authorization
    }).then((rs) => {
        let key = rs[0].key;
        userDetailsTable.updateOne({
            key: key,
            comments: {
                $elemMatch: {
                    blogId: reqData.blogId
                }
            }
        }, {
            $push: {
                'comments.$.commentsData': {
                    ...commentsData
                }
            }
        }).then( async (rs) => {
            if (rs.n < 1) {
                // 在用户详情表里面当前没有这个博客id的评论数据
                let blogData = {};// 取出这个博客的一些基本信息
                 await blogTable.find({
                    blogId: reqData.blogId
                }, {
                    title: true,
                    authorInformation: true,
                    cover: true,
                    description: true,
                    lastModifiedTime: true
                }).then(rs => {
                    blogData = rs[0];
                });
                userDetailsTable.updateOne({
                    key:key,
                }, {
                    $push: {
                        'comments': {
                            blogId: reqData.blogId,
                            blogData,
                            commentsData: [
                                commentsData
                            ]
                        }
                    }
                }).then(rs => {
                    console.log('创建新博客id的评论数据');
                });
            }
        })
    })

    if (reqData.fatherId) {
        // 往博客里面的某个评论的comments字段添加值
        blogTable.updateOne({
            blogId: reqData.blogId,
            comments: {
                $elemMatch: {
                    commentId: reqData.fatherId
                }
            }
        }, {
            $push: {
                'comments.$.comments': commentsData
            }
        }).then(rs => {
            console.log('新增一个二级评论');
            res.send({
                status: 200,
                message: '评论成功',
                data: {
                    commentsData
                }
            })
        })
    } else {
        // 往博客里面的某个评论添加值
        blogTable.updateOne({
            blogId: reqData.blogId
        }, {
            $push: {
                'comments': commentsData
            }
        }).then(rs => {
            console.log('新增一个二级评论');
            res.send({
                status: 200,
                message: '评论成功',
                data: {
                    commentsData
                }
            })
        })
    }
});

blogApp.get("/getMyBlog", async function (req, res) {
    let params = {};
    let {
        offset,
        limit,
        searchKey
    } = req.query;
    // 当用户传过来一个搜索字段的时候
    if (searchKey) {
        params.title = searchKey;
    }
    // 设置博客作者信息
    userTable.find({
        token: req.headers.authorization
    }).then(async  (rs) => {
        if(rs.length){
        let totalNum = 0; // 博客总数
        await blogTable.find({
            'authorInformation.name':rs[0].userName,
        }).then(blogList => {
            totalNum = blogList.length; // 获取博客总数
        })

        blogTable.find({
            'authorInformation.name':rs[0].userName,
            ...params
        }, {
            content: false,
            _id: false,
            __v: false
        }, {
            skip: Number(offset),
            limit: Number(limit),
            sort: {
                lastModifiedTime: -1
            }
        }).then(blogList => {
            res.send({
                status: 200,
                message: '查询成功',
                data: {
                    blogList,
                    totalNum
                }
            })
        })
    }
    })
});

blogApp.get("/getMyLikeBlog", async function (req, res) {
    let params = {};
    let {
        offset,
        limit,
        searchKey
    } = req.query;

    //当用户传过来搜索字段时
    if (searchKey) {
        params.title = searchKey;
    }
    userTable.find({
        token: req.headers.authorization
    }).then(async rs => {
        if(rs.length){
        let totalNum = 0;//博客总数
        let likes = [];
        await userDetailsTable.find({
            key:rs[0].key
        }).then(userDetails=>{
            totalNum = userDetails[0].likes.length;
            likes = userDetails[0].likes;
        })
        blogTable.find({
            blogId:{
                $in:likes
            },
            ...params
        }, {
            content: false,
            _id: false,
            __v: false
        }, {
            skip: Number(offset),
            limit: Number(limit),
            sort: {
                lastModifiedTime: -1
            }
        }).then(blogList => {
            res.send({
                status: 200,
                message: "查询成功",
                data: {
                    blogList,
                    totalNum
                }
            })
        })
    }
    })

});

blogApp.get("/getUnapprovedBlog", async function (req, res) {
    let params = {};
    let {
        offset,
        limit,
        searchKey
    } = req.query;
    //当用户传过来搜索字段时
    if (searchKey) {
        params.title = new RegExp(`${searchKey}`);
    }
    let totalNum = 0;//博客总数
    await blogTable.find({
        ...params,
        approved:false
    }).then(rs => {
        totalNum = rs.length;//获取总数
    })
    blogTable.find({
        ...params,
        approved:false
    }, {
        _id: false,
        __v: false
    }, {
        skip: Number(offset),
        limit: Number(limit),
        sort: {
            lastModifiedTime: -1
        }
    }).then(blogList => {
        res.send({
            status: 200,
            message: "查询成功",
            data: {
                blogList,
                totalNum
            }
        })
    })
});

blogApp.get("/getAllBlog", async function (req, res) {
    let params = {};
    let {
        offset,
        limit,
        searchKey
    } = req.query;
    //当用户传过来搜索字段时
    if (searchKey) {
        params.title = new RegExp(`${searchKey}`);
    }
    let totalNum = 0;//博客总数
    await blogTable.find({
        ...params
    }).then(rs => {
        totalNum = rs.length;//获取总数
    })
    blogTable.find({
        ...params
    }, {
        _id: false,
        __v: false
    }, {
        skip: Number(offset),
        limit: Number(limit),
        sort: {
            lastModifiedTime: -1
        }
    }).then(blogList => {
        res.send({
            status: 200,
            message: "查询成功",
            data: {
                blogList,
                totalNum
            }
        })
    })
});

blogApp.post("/approvedBlog", async function (req, res) {
    let params = {
        blogId: req.body.blogId
    };

    userTable.find({
        token:req.headers.authorization
    }).then(async rs=>{
        if(rs.length && rs[0].isAdmin){
            blogTable.updateOne(
                params,
                {
                    $set:{
                        approved:true
                    }
                }
            ).then(rs => {
                res.send({
                    status: 200,
                    message: "批准成功",
                })
            })
        }else{
            res.send({
                status:401,
                message:"没有操作权限"
            })
        }
    })

});

blogApp.post("/deleteBlog", async function (req, res) {
    let params = {
        blogId: req.body.blogId
    };
    userTable.find({
        token:req.headers.authorization
    }).then(async rs=>{
        if(rs.length && rs[0].isAdmin){
            blogTable.deleteOne(params).then(rs => {
                res.send({
                    status: 200,
                    message: "删除成功",
                })
            })
        }else{
            res.send({
                status:401,
                message:"没有操作权限"
            })
        }
    })

});

blogApp.get('/getBlogInfo', function (req, res){
    userTable.find({
        token: req.headers.authorization
    }).then((rs)=>{
        if (rs.length && rs[0].isAdmin){
            blogTable.find({},{
                lastModifiedTime: true
            }).then((blogInfo)=>{
                res.send({
                    status: 200,
                    data: {
                        blogInfo
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
    blogApp
}