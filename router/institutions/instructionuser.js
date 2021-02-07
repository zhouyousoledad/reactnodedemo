var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
const logs = require("../common.js");
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
		var myobj = {}
		var ourarr = []
		var otherres = res
		if(req.query.nickname != '' && req.query.nickname != null) {
			var str = "^.*" + req.query.nickname + ".*$"
			var reg = new RegExp(str)
			myobj.nickname = reg
		}
		if(req.query.tel != '' && req.query.tel != null) {
			var reg = new RegExp(req.query.tel)
			myobj.tel = reg
		}
		if(req.query.dept != '' && req.query.dept != null){
			myobj.dept = req.query.dept
		}
		console.log(myobj)
		dbo.collection("instructionuser").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("instructionuser").find(myobj).toArray(function(err, result) {
				var pList = []
				ourarr = result
				for(var i = 0; i < ourarr.length; i++) {
					(function(i) {
						pList.push(new Promise(function(resolve, reject) {
							var pid = ourarr[i].dept
							dbo.collection("instruction").find({
								"_id": ObjectId(pid)
							}).toArray(function(err, results) {
								ourarr[i].deptname = results[0].name
								ourarr[i].key = i
								resolve()
							})	
						}))
					})(i);
				}
				Promise.all(pList).then(function(res) {
					var data = {
						code: 200,
						data: ourarr,
						total: num,
					}
					otherres.jsonp(data)
				})
			})
		})
	})
	router.post('/add', function(req, res, next) {
		var myobj = req.body
		myobj.enabled = 1
		var ress = res
		dbo.collection("instructionuser").insertOne(myobj, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '添加成功'
			}
			ress.jsonp(data);
		})
	})
	router.post('/eduit', function(req, res, next) {
		var myobj = {
			"_id": ObjectId(req.body.id)
		};
		var newobj = req.body
		var ress = res
		delete newobj.id
		var updateStr = {
			$set: newobj
		};
		dbo.collection("instructionuser").updateOne(myobj, updateStr, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '修改成功'
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
			dbo.collection("instructionuser").deleteMany(myobj, function(err, obj) {
					if (err) throw err;
						var data={
							code: 200,
							msg:'删除成功'
						}
					ress.jsonp(data);
			});
	})
	router.post('/open',function(req,res,next){
		var myobj = {
			"_id": ObjectId(req.body.id)
		}
		var newobj = {
			"enabled":0
		}
		if(req.body.id){
			newobj.enabled = 1
		}else{
			newobj.enabled = 0
		}
		var ress = res
		var updateStr = {
			$set: newobj
		};
		dbo.collection("instructionuser").updateOne(myobj, updateStr, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '操作成功'
			}
			ress.jsonp(data);
		});
	})
	
	
})

module.exports = router