var express=require('express');
var router=express.Router();

var logins = require('./common/index.js')
var dict = require('./common/dict.js')
var type = require('./type/type.js')
var label = require('./label/label.js')
var medias = require('./media/media.js')
var warning = require('./warning/warning.js')
router.use('/login',logins);
router.use('/dict',dict);
router.use('/type',type);
router.use('/label',label);
router.use('/media',medias);
router.use('/warning',warning)
//如果login  product user  不存在，则会走下面这个
router.use("/",function(req,res){
  res.send("table/");
})
 
module.exports =router;//暴露模
