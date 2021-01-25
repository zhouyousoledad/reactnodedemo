var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
var urls = require("url");
//const logs = require("../common.js");
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
		myobj.pid = 0
		dbo.collection("label").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("label").find(myobj).limit(limp).skip(skip).toArray(function(err, result) {
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
	router.get('/detail', function(req, res, next) { //查询详细
		var limp = Number(req.query.size)
		var skip = (req.query.page - 1) * limp
		var myobj = {}
		if(req.query.pid != '' && req.query.pid != null) {
			myobj.pid = req.query.pid
		}
		dbo.collection("label").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("label").find(myobj).limit(limp).skip(skip).toArray(function(err, result) {
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
	router.get('/labelchild', function(req, res, next) {
		dbo.collection("label").find({}).toArray(function(err, result) {
			var newtree = toTree(result)
			var data = {
				code: 200,
				data: newtree
			}
			res.jsonp(data)
		})
	})
	router.post('/add', function(req, res, next) { //添加字典
		var myobj = req.body
		var ress = res
		dbo.collection("label").insertOne(myobj, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '添加成功'
			}
			ress.jsonp(data);
		})
	})
	router.post('/adddetail', function(req, res, next) { //添加字典
		var myobj = req.body
		var ress = res
		dbo.collection("label").insertOne(myobj, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '添加成功'
			}
			ress.jsonp(data);
		})
	})
	router.post('/eduit', function(req, res, next) { //修改字典
		var myobj = {
			"_id": ObjectId(req.body.id)
		};
		var newobj = req.body
		var ress = res
		delete newobj.id
		var updateStr = {
			$set: newobj
		};
		dbo.collection("label").updateOne(myobj, updateStr, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '修改成功'
			}
			ress.jsonp(data);
		});
	})
	router.post('/eduitdetail', function(req, res, next) { //修改字典
		var myobj = {
			"_id": ObjectId(req.body.id)
		};
		var newobj = req.body
		var ress = res
		delete newobj.id
		var updateStr = {
			$set: newobj
		};
		dbo.collection("label").updateOne(myobj, updateStr, function(err, res) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '修改成功'
			}
			ress.jsonp(data);
		});
	})
	router.post('/delete', function(req, res, next) { //删除字典，可批量
		var arr = []
		var ress = res
		var idarr = req.body.id.split(',')
		idarr.forEach(v => {
			var myobjs = {
				"pid": v
			}
			dbo.collection("label").find(myobjs).toArray(function(err, result) {
				var findarr = []
				result.forEach(a => {
					findarr.push(a._id)
				})
				var myobjss = {
					"_id": {
						$in: findarr
					}
				};
				dbo.collection("label").deleteMany(myobjss, function(err, obj) {
					if(err) throw err;
				});
			})
			v = ObjectId(v)
			arr.push(v)
		})
		var myobj = {
			"_id": {
				$in: arr
			}
		};
		dbo.collection("label").deleteMany(myobj, function(err, obj) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '删除成功'
			}
			ress.jsonp(data);
		});

	})
	router.post('/deletedetail', function(req, res, next) { //删除字典，可批量
		var arr = []
		var ress = res
		var idarr = req.body.id.split(',')
		idarr.forEach(v => {
			v = ObjectId(v)
			arr.push(v)
		})
		var myobj = {
			"_id": {
				$in: arr
			}
		};
		dbo.collection("label").deleteMany(myobj, function(err, obj) {
			if(err) throw err;
			var data = {
				code: 200,
				msg: '删除成功'
			}
			ress.jsonp(data);
		});

	})
})

function toTree(data) {
	let result = []
	if(!Array.isArray(data)) {
		return result
	}
	data.forEach(item => {
        item.children = []
    });
	let map = {};
	data.forEach(item => {
		map[item._id] = item;
	});
	data.forEach(item => {
		let parent = map[item.pid];
		if(parent) {
			(parent.children || (parent.children = [])).push(item);
		} else {
			result.push(item);
		}
	});
	return result;
}
module.exports = router