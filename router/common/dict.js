var express=require('express');
var router=express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
var urls = require("url");
var findname = ''
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
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
		dbo.collection("dict").find(myobj).count(function (err, result) {
			var num = result
			dbo.collection("dict").find(myobj).limit(limp).skip(skip).toArray(function(err,result){
				var data={
					code:200,
					data:result,
					total:num,
				}
				res.jsonp(data)	
			})							
		})
	})
	router.get('/detail',function(req,res,next){
		findname = req.query.name
		var limp = Number(req.query.size)
		var skip = (req.query.page-1)*limp
		var myobj = {"name":req.query.name}

		if(isNaN(limp)){
			dbo.collection("dictdeatil").find(myobj).count(function (err, result) {
			var num = result
			dbo.collection("dictdeatil").find(myobj).toArray(function(err,result){
				for(var i=0;i<result.length;i++){
					delete result[i].name
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
		}else{
			dbo.collection("dictdeatil").find(myobj).count(function (err, result) {
			var num = result
			dbo.collection("dictdeatil").find(myobj).limit(limp).skip(skip).toArray(function(err,result){
				for(var i=0;i<result.length;i++){
					delete result[i].name
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
		}
		
		
		
	})
	router.post('/add',function(req,res,next){	 //添加字典
			var myobj = req.body
			var ress = res
			dbo.collection("dict").insertOne(myobj,function(err, res) {
				if(err) throw err;
					var data={
						code: 200,
						msg:'添加成功'
					}
				ress.jsonp(data);
			})
	})
	router.post('/adddeatil',function(req,res,next){	 //添加字典详细
			var myobj = req.body
			var ress = res
			if(findname != '' && findname != null){
				myobj.name = findname
				dbo.collection("dictdeatil").insertOne(myobj,function(err, res) {
				if(err) throw err;
					var data={
						code: 200,
						msg:'添加成功'
					}
				ress.jsonp(data);
				})
			}else{
				var data={
						code: 0,
						msg:'请选择字典'
					}
				ress.jsonp(data);
			}
			
	})
	router.post('/eduit',function(req,res,next){	//修改字典
			var myobj ={"_id":ObjectId(req.body.id)};	
			var newobj = req.body
			var ress = res
			delete newobj.id
			var updateStr = {$set:newobj};
				dbo.collection("dict").updateOne(myobj, updateStr, function(err, res) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'修改成功'
						}
						ress.jsonp(data);  
				});
	})
	router.post('/eduitdetail',function(req,res,next){	//修改字典
			var myobj ={"_id":ObjectId(req.body.id)};	
			var newobj = req.body
			var ress = res
			delete newobj.id
			var updateStr = {$set:newobj};
				dbo.collection("dictdeatil").updateOne(myobj, updateStr, function(err, res) {
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
			console.log(req.body.id)
			var idarr = req.body.id.split(',')
			idarr.forEach(v=>{
				v = ObjectId(v)
				var myobjs ={"_id":v}
				dbo.collection("dict").find(myobjs).toArray(function (err, result) {
					var newobj={"name":result[0].name}
					dbo.collection("dictdeatil").find(newobj).toArray(function (err, result) {
						var findarr = []
						result.forEach(a=>{
							findarr.push(a._id)
						})
						var myobjss ={"_id":{$in:findarr}};
						dbo.collection("dictdeatil").deleteMany(myobjss, function(err, obj) {
							if (err) throw err;		
						});
					})
				})
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};								
			dbo.collection("dict").deleteMany(myobj, function(err, obj) {
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
			console.log(req.body.id)
			var idarr = req.body.id.split(',')
			idarr.forEach(v=>{
				v = ObjectId(v)
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};								
			dbo.collection("dictdeatil").deleteMany(myobj, function(err, obj) {
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