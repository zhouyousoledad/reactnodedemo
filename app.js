var express = require('express')
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var index=require('./router/index.js')
var app = express();
var session=require("express-session");
app.all('*', function(req, res, next) {
	
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers",  " Origin, X-Requested-With, Content-Type, Accept,token,userid");
    //允许请求资源的方式
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');

   next();
});
app.use(cookieParser());
app.use(session({
    secret: 'secret', // 对session id 相关的cookie 进行签名
    resave: true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie: {
        maxAge: 1000 * 60 * 3, // 设置 session 的有效时间，单位毫秒
    },
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.get('/public/img/*', function (req, res) {
    res.sendFile( __dirname + "/" + req.url );
})
app.get('/public/media/*', function (req, res) {
    res.sendFile( __dirname + "/" + req.url );
})
app.use('/react',index)

app.listen(3032);

