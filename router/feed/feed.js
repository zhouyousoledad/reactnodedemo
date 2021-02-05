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
	router.get('/list', function(req, res, next) { //查询
		var limp = Number(req.query.size)
		var skip = (req.query.page - 1) * limp
		var myobj = {}
		if(req.query.userName != '' && req.query.userName != null) {
			var str="^.*"+req.query.userName+".*$"
    		var reg = new RegExp(str)
			myobj.userName = reg
		}
		if(req.query.feedTime != '' && req.query.feedTime != null) {
			myobj.feedTime = req.query.feedTime
		}
		dbo.collection("feed").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("feed").find(myobj).limit(limp).skip(skip).toArray(function(err, result) {
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

	
	router.post('/delete',function(req,res,next){  //删除
			var arr=[]
			var ress = res
			var idarr = req.body.id.split(',')
			idarr.forEach(v=>{
				v = ObjectId(v)
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};								
			dbo.collection("feed").deleteMany(myobj, function(err, obj) {
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