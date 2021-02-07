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
		if(req.query.name != '' && req.query.name != null) {
			var str = "^.*" + req.query.name + ".*$"
			var reg = new RegExp(str)
			myobj.name = reg
		}
		dbo.collection("instruction").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("instruction").find(myobj).toArray(function(err, result) {
				for(var i = 0; i < result.length; i++) {
					result[i].key = i
				}
				logs.toTree(result).then((children) => {
					var data = {
						code: 200,
						data: children,
						total: num,
					}
					res.jsonp(data)
				})

			})
		})
	})
	router.get('/choose', function(req, res, next) {
		dbo.collection("instruction").find({}).toArray(function(err, result) {
			for(var i = 0; i < result.length; i++) {
				result[i].title = result[i].name
				result[i].value = result[i]._id
			}
			logs.toTree(result).then((children) => {
				var data = {
					code: 200,
					data: children,
				}
				res.jsonp(data)
			})

		})
	})
	router.post('/add', function(req, res, next) {
		var myobj = req.body
		var ress = res
		dbo.collection("instruction").insertOne(myobj, function(err, res) {
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
		dbo.collection("instruction").updateOne(myobj, updateStr, function(err, res) {
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
		var flags = true
		var idarr = req.body.id.split(',')
		var pList = []
		for(var i = 0; i < idarr.length; i++) {
			(function(i) {
				pList.push(new Promise(function(resolve, reject) {
					dbo.collection("instruction").find({
						"pid": idarr[i]
					}).toArray(function(err, result) {

						if(result.length != 0) {
							flags = false
						}
						resolve()
					})

				}))
			})(i);
			idarr[i] = ObjectId(idarr[i])
			arr.push(idarr[i])
		}
		Promise.all(pList).then(function(res) {
			console.log(flags)
			if(flags) {
				var myobj = {
					"_id": {
						$in: arr
					}
				};
				dbo.collection("instruction").deleteMany(myobj, function(err, obj) {
					if(err) throw err;
					var data = {
						code: 200,
						msg: '删除成功'
					}
					ress.jsonp(data);
				});
			} else {
				var data = {
					code: 202,
					msg: '删除的对象含有子级,请先删除子级',
				}
				ress.jsonp(data);
			}

		})

	})
})

module.exports = router