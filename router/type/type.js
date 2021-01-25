var express=require('express');
var router=express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
var urls = require("url");
var path= require("path");
var multiparty = require('multiparty');
var uploadDir='/public/img/';
var fs = require('fs');
const logs = require("../common.js");
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
MongoClient.connect(url, { useNewUrlParser: true,useUnifiedTopology: true }, function(err, db) {
	if (err) throw err;
	var dbo = db.db("React");  //选择数据库
	router.get('/list',function(req,res,next){  //查询字典
		var limp = Number(req.query.size)
		var skip = (req.query.page-1)*limp
		var myobj = {}
		if(req.query.name != '' && req.query.name !=null){
			var str="^.*"+req.query.name+".*$"
    		var reg = new RegExp(str)
			myobj.name = reg
		}
		myobj.pid = 0
		dbo.collection("type").find(myobj).count(function (err, result) {
			var num = result
			dbo.collection("type").find(myobj).limit(limp).skip(skip).toArray(function(err,result){
				for(var i=0;i<result.length;i++){
					result[i].key = i
				}
				var data={
					code:200,
					data:result,
					total:num,
				}
				res.jsonp(data)	
			})							
		})
	})
	router.get('/detail',function(req,res,next){  //查询详细
		var limp = Number(req.query.size)
		var skip = (req.query.page-1)*limp
		var myobj = {}
		if(req.query.pid != '' && req.query.pid !=null){
			myobj.pid = req.query.pid
		}
		dbo.collection("type").find(myobj).count(function (err, result) {
			var num = result
			dbo.collection("type").find(myobj).limit(limp).skip(skip).toArray(function(err,result){
				for(var i=0;i<result.length;i++){
					result[i].key = i
				}
				var data={
					code:200,
					data:result,
					total:num,
				}
				res.jsonp(data)	
			})							
		})
	})
	router.get('/findname',function(req,res,next){
		var myobj = {"typeCode":req.query.typeCode}
		dbo.collection("type").find(myobj).toArray(function(err,result){

			var idobj = {"pid":(result[0]._id).toString()}
			
			dbo.collection("type").find(idobj).toArray(function(err,results){
			
				var data={
					code:200,
					data:results,
				}
				res.jsonp(data)	
			})
		})
	})
	router.post('/add',function(req,res,next){	 //添加字典
			var myobj = req.body
			var ress = res
			dbo.collection("type").insertOne(myobj,function(err, res) {
				if(err) throw err;
					var data={
						code: 200,
						msg:'添加成功'
					}
				ress.jsonp(data);
			})
	})
	router.post('/adddetail',function(req,res,next){	 //添加字典
			var ress = res
			let form = new multiparty.Form();
			form.parse(req, function(err,fields,file){
			
				if(file.file == undefined){
					var obj={
							"name":fields.name,
							"remarks":fields.remarks,
							"sort":fields.sort,
							"institutions":fields.institutions,
							"pid":fields.pid
						}
			dbo.collection("type").insertOne(obj,function(err, res) {
				if(err) throw err;
					var data={
						code: 200,
						msg:'添加成功'
					}
				ress.jsonp(data);
			})
				}else{
					var filename = logs.randomname()
			var filepath = uploadDir + filename + '.jpg'
			var readStream=fs.createReadStream(file.file[0].path);
			var writeStream=fs.createWriteStream('.'+filepath);
			readStream.pipe(writeStream);
			readStream.on('end',function(){
				fs.unlinkSync(file.file[0].path);
				var obj={
							"name":fields.name,
							"remarks":fields.remarks,
							"sort":fields.sort,
							"institutions":fields.institutions,
							"url":filepath,
							"pid":fields.pid
						}
			dbo.collection("type").insertOne(obj,function(err, res) {
				if(err) throw err;
					var data={
						code: 200,
						msg:'添加成功'
					}
				ress.jsonp(data);
			})
			});
				}
			
            
					
            
            
			});
	})
	router.post('/eduitdetail',function(req,res,next){	//修改类型详细
			var ress = res
			let form = new multiparty.Form();
			form.parse(req, function(err,fields,file){
				var myobj ={"_id":ObjectId(fields.id[0])};
				if(file.file == undefined){
					var obj={
							"name":fields.name,
							"remarks":fields.remarks,
							"sort":fields.sort,
							"institutions":fields.institutions,
							"pid":fields.pid
						}
						
					var updateStr = {$set:obj};
					
					dbo.collection("type").updateOne(myobj, updateStr, function(err, res) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'修改成功1'
						}
						ress.jsonp(data);  
				});
				}else{
					var filename = logs.randomname()
			var filepath = uploadDir + filename + '.jpg'
			var readStream=fs.createReadStream(file.file[0].path);
			var writeStream=fs.createWriteStream('.'+filepath);
			readStream.pipe(writeStream);
			readStream.on('end',function(){
				fs.unlinkSync(file.file[0].path);
				var obj={
							"name":fields.name,
							"remarks":fields.remarks,
							"sort":fields.sort,
							"institutions":fields.institutions,
							"url":filepath,
							"pid":fields.pid
						}
				var updateStr = {$set:obj};	
					dbo.collection("type").updateOne(myobj, updateStr, function(err, res) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'修改成功2'
						}
						ress.jsonp(data);  
				});		
			
			});
				}	
			})
			
				
	})
	router.post('/eduit',function(req,res,next){	//修改字典
			var myobj ={"_id":ObjectId(req.body.id)};	
			var newobj = req.body
			var ress = res
			delete newobj.id
			var updateStr = {$set:newobj};
				dbo.collection("type").updateOne(myobj, updateStr, function(err, res) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'修改成功'
						}
						ress.jsonp(data);  
				});
	})
	router.post('/delete',function(req,res,next){  //删除字典，可批量
			var arr=[]
			var ress = res
			var idarr = req.body.id.split(',')
			idarr.forEach(v=>{
				var myobjs ={"pid":v}
				dbo.collection("type").find(myobjs).toArray(function (err, result) {
					var findarr = []
					result.forEach(a=>{
						findarr.push(a._id)
					})
					var myobjss ={"_id":{$in:findarr}};
					dbo.collection("type").deleteMany(myobjss, function(err, obj) {
						if (err) throw err;		
					});
				})
				v = ObjectId(v)
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};								
			dbo.collection("type").deleteMany(myobj, function(err, obj) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'删除成功'
						}
					ress.jsonp(data);
			});	
	})
	router.post('/deletedetail',function(req,res,next){  //删除字典，可批量
			var arr=[]
			var ress = res
			var idarr = req.body.id.split(',')
			//fs.unlinkSync(file.file[0].path);
			idarr.forEach(v=>{
				v = ObjectId(v)
				var myobj ={"_id":v}
				dbo.collection("type").find(myobj).toArray(function (err, result) {
					if(result[0].url){
						fs.unlinkSync('.'+result[0].url);
					}
				})
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};								
			dbo.collection("type").deleteMany(myobj, function(err, obj) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'删除成功'
						}
					ress.jsonp(data);
			});
			
	})
	
})	
module.exports=router