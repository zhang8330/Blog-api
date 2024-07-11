let express = require("express");
let mongoose = require("mongoose");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
let apiAddress = require("./config/publicPath");


mongoose.connect("mongodb://127.0.0.1:27017/blogDB", {
    useNewUrlParser: true,//使用新的解析器
    useUnifiedTopology: true//重连的设置参数无效
}).then(() => {
    console.log("数据库连接成功");
}).catch(() => {
    console.log("数据库链接失败");
});
//生成服务实例
let app = express();
//启用通用中间件
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


//对所有的路由处理跨域请求
app.all('*', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    next();
})
//挂载其他应用
let {uploadImgFileApp} = require("./service/imgUploadService");
let {getImgFileApp} = require("./service/imgGetService");
let {authenticationApp} = require("./service/userIdentificationAuthenticationService");
let {blogApp} = require("./service/blogDataService");
let {userDetailsApp} = require("./service/userDetailsService");
let {tipOffApp} = require("./service/tipOffService");
let {websiteDataApp} = require('./service/websiteDataServer');
//启用各种服务
app.use(apiAddress.uploadImgApiAddress, uploadImgFileApp);
app.use(apiAddress.getImgApiAddress, getImgFileApp);
app.use(apiAddress.authenticationApiAddress, authenticationApp);
app.use(apiAddress.blogApiAddress, blogApp);
app.use(apiAddress.userDetailsApiAddress, userDetailsApp);
app.use(apiAddress.tipOffApiAddress, tipOffApp);
app.use(apiAddress.websiteDataApiAddress,websiteDataApp);
//启用服务
app.listen(8888);

console.log("言吾后端系统启动");

const WebSocket = require("ws");
const wss = new WebSocket.Server({port:12581});
let userList = [];
wss.on("connection",function connection(user){
    userList.push(user);//当新用户链接了，我们就把用户存起来
    user.on("message",function incoming(message){
        for(let i = 0,len = userList.length;i<len;i++){
            if(userList[i] !== user){
                userList[i].send(message);
            }
        }
    })
})