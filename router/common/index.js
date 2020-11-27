var express=require('express');
var session=require("express-session");
var router=express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var querystring = require("querystring");
var ObjectId = require('mongodb').ObjectId;
var svgCaptcha = require('svg-captcha');
var url = "mongodb://localhost:27017/";
var urls = require("url");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
MongoClient.connect(url, { useNewUrlParser: true,useUnifiedTopology: true }, function(err, db) {
	if (err) throw err;
	var dbo = db.db("React");  //选择数据库
	router.post('/code',function(req,res){
		
		var captcha = svgCaptcha.create({
        size: 4,  //验证码长度
        width: 90, //svg宽度
        height: 25, //svg高度
        noise: 2, //干扰线条数
        fontSize: 40, //字体大小
        ignoreChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxz',   //验证码字符中排除
        color: true // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有           
    });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send({
        code: 200,
        result: captcha.data
    });
	})
	router.post('/login',function(req,res,next){
		console.log(req.session.captcha)
		var myobj = {"username":req.body.username,"password":req.body.password}
		var data;
		var code = req.body.code.toLowerCase()
		if(code != req.session.captcha){
			data = {
					code:0,
					msg:'验证码错误'
				}
		}else{
			dbo.collection("user").find(myobj).toArray(function(err, result) { // 返回集合中所有数据
			if(result == ""){
				data = {
					code:1,
					msg:'账户不存在'
				}
			}else if(result[0].password != req.body.password){
				data = {
					code:2,
					msg:'密码错误',
				}
			}else{
				var dd = new Date();
				data={
					code:200,
					msg:'登录成功',
					data:{
						username:result[0].username,
						userid:result[0]._id
					}
				}
			}
			res.jsonp(data)			
        }); 
		}
        	
		//req.session.userinfo=req.body.username
	})
})
module.exports=router