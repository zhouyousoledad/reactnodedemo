var express=require('express');
var router=express.Router();

var find=require('./table/project.js');//路由，查
var admin= require('./table/admin.js')
var bug = require('./table/buglist.js')
var logins = require('./common/index.js')
var dict = require('./common/dict.js')
var type = require('./type/type.js')
router.use('/project',find);//   /login 映射到find这个路由
router.use('/admin',admin);
router.use('/buglist',bug);
router.use('/login',logins);
router.use('/dict',dict);
router.use('/type',type);
//如果login  product user  不存在，则会走下面这个
router.use("/",function(req,res){
  res.send("table/");
})
 
module.exports =router;//暴露模
