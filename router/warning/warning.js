var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";

router.use(bodyParser.urlencoded({
	extended: false
}));
router.use(bodyParser.json());
MongoClient.connect(url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}, function(err, db) {
	if(err) throw err;
	var dbo = db.db("React"); //选择数据库
	router.get('/list', function(req, res, next) { //查询字典
		var limp = Number(req.query.size)
		var skip = (req.query.page - 1) * limp
		var myobj = {}
		if(req.query.name != '' && req.query.name != null) {
			var str="^.*"+req.query.name+".*$"
    		var reg = new RegExp(str)
			myobj.name = reg
		}
		if(isNaN(limp)){
			skip = 0
			limp = 0
			myobj = {}
		}
		dbo.collection("warning").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("warning").find(myobj).limit(limp).skip(skip).toArray(function(err, result) {
				for(var i = 0; i < result.length; i++) {
					result[i].key = i
				}
				var data = {
					code: 200,
					data: result,
					total: num,
				}
				res.jsonp(data)
			})
		})
	})
	router.post('/add',function(req,res,next){
		var myobj = req.body
		var ress = res
		dbo.collection("warning").insertOne(myobj,function(err, res) {
			if(err) throw err;
				var data={
					code: 200,
					msg:'添加成功'
				}
			ress.jsonp(data);
		})
	})
	router.post('/eduit',function(req,res,next){
		var myobj ={"_id":ObjectId(req.body.id)};	
		var newobj = req.body
		var ress = res
		delete newobj.id
		var updateStr = {$set:newobj};
			dbo.collection("warning").updateOne(myobj, updateStr, function(err, res) {
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
				v = ObjectId(v)
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};								
			dbo.collection("warning").deleteMany(myobj, function(err, obj) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'删除成功'
						}
					ress.jsonp(data);
			});
	})
})	
module.exports = router