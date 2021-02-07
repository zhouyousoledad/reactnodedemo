var express=require('express');
var router=express.Router();

var logins = require('./common/index.js')
var dict = require('./common/dict.js')
var type = require('./type/type.js')
var label = require('./label/label.js')
var medias = require('./media/media.js')
var warning = require('./warning/warning.js')
var feed = require('./feed/feed.js')
var comments = require('./comments/comments.js')
var institutions = require('./institutions/institutions.js')
var institutionuser = require('./institutions/instructionuser.js')
router.use('/login',logins);
router.use('/dict',dict);
router.use('/type',type);
router.use('/label',label);
router.use('/media',medias);
router.use('/warning',warning)
router.use('/feed',feed)
router.use('/comments',comments)
router.use('/institutions',institutions)
router.use('/institutionuser',institutionuser)
router.use("/",function(req,res){
  res.send("table/");
})
 
module.exports =router;//暴露模
