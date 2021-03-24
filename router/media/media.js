var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
var urls = require("url");
var path = require("path");
var multiparty = require('multiparty');
var uploadDir = '/public/media/';
var fs = require('fs');
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
		var limp = Number(req.query.size)
		var skip = (req.query.page - 1) * limp
		var otherres = res
		var myobj = {}
		var totalarr = []
		if(req.query.mediaType != '' && req.query.mediaType != null) {
			myobj.mediaType = req.query.mediaType
		}
		if(req.query.systemType != '' && req.query.systemType != null) {
			myobj.typeId = req.query.systemType
		}
		dbo.collection("media").find(myobj).count(function(err, result) {
			var num = result
			dbo.collection("media").find(myobj).limit(limp).skip(skip).toArray(function(err, doresult) {
				totalarr = doresult
				var pList = []
				for(var i=0;i<totalarr.length;i++) {
					(function(i) {
  					pList.push(new Promise(function(resolve, reject) {
  							var mediaType = totalarr[i].mediaType
  							var type = totalarr[i].typeId
  							var label = []
  							var labelname = []
  							totalarr[i].tagIds = totalarr[i].tagIds.split(',')
  							totalarr[i].tagIds.forEach(a=>{
								a = ObjectId(a)
								label.push(a)
							})
  							totalarr[i].key = i
   							dbo.collection("dictdeatil").find({
								"name": "media_type",
								"value": mediaType
							}).toArray(function(err, results) {
								totalarr[i].mediaName = results[0].label
								dbo.collection("type").find({
									"_id": ObjectId(type)
								}).toArray(function(err, resultss) {
									totalarr[i].typeName = resultss[0].name.join(',')
									dbo.collection("label").find({
										"_id": {
											$in: label
										}
									}).toArray(function(err, resultas) {
										resultas.forEach(v => {
											labelname.push(v.name)
										})
										totalarr[i].labelName = labelname.join(',')
										resolve()
									})	
									
								})	
							})	
  					}))
  					})(i);
				}
				Promise.all(pList).then(function(res) {
					var data = {
						code: 200,
						data: totalarr,
						total: num,
					}
					otherres.jsonp(data)
				})
			})
		})
	})
	router.post('/add', function(req, res, next) { //添加字典
		var ress = res
		let form = new multiparty.Form();
		form.parse(req, function(err, fields, file) {

			if(file.file == undefined) {
				var obj = {
					"name": fields.name[0],
					"remarks": fields.remarks[0],
					"sort": fields.sort[0],
					"typeId": fields.typeId[0],
					"tagIds": fields.tagIds.join(','),
					"mediaType": fields.mediaType[0],
					"fonts": fields.fonts[0],
					"url": ""
				}
				dbo.collection("media").insertOne(obj, function(err, res) {
					if(err) throw err;
					var data = {
						code: 200,
						msg: '添加成功'
					}
					ress.jsonp(data);
				})
			} else {
				var end = ''
				if(fields.mediaType[0] == 0){
					end = '.jpg'
				}else if(fields.mediaType[0] == 1){
					end = '.mp4'
				}else if(fields.mediaType[0] == 2){
					end = '.mp3'
				}
				var filename = logs.randomname()
				var filepath = uploadDir + filename + end
				var readStream = fs.createReadStream(file.file[0].path);
				var writeStream = fs.createWriteStream('.' + filepath);
				readStream.pipe(writeStream);
				readStream.on('end', function() {
					fs.unlinkSync(file.file[0].path);
					var obj = {
						"name": fields.name[0],
						"remarks": fields.remarks[0],
						"sort": fields.sort[0],
						"typeId": fields.typeId[0],
						"tagIds": fields.tagIds.join(','),
						"mediaType": fields.mediaType[0], 
						"url": filepath,
						"fonts": ""
					}
					dbo.collection("media").insertOne(obj, function(err, res) {
						if(err) throw err;
						var data = {
							code: 200,
							msg: '添加成功'
						}
						ress.jsonp(data);
					})
				});
			}

		});
	})
	router.post('/eduit', function(req, res, next) { //修改类型详细
		var ress = res
		let form = new multiparty.Form();
		form.parse(req, function(err, fields, file) {
			var myobj = {
				"_id": ObjectId(fields.id[0])
			};
			if(file.file == undefined) {
				var obj = {
					"name": fields.name[0],
					"remarks": fields.remarks[0],
					"sort": fields.sort[0],
					"typeId": fields.typeId[0],
					"tagIds": fields.tagIds.join(','),
					"mediaType": fields.mediaType[0],
					"fonts": fields.fonts[0],
					"url": ""
				}
				var updateStr = {
					$set: obj
				};
				if(fields.mediaType == 3){
					dbo.collection("media").find(myobj).toArray(function (err, result) {
						if(result[0].url){
							fs.unlinkSync('.'+result[0].url);
						}
					})
				}
				dbo.collection("media").updateOne(myobj, updateStr, function(err, res) {
					if(err) throw err;
					var data = {
						code: 200,
						msg: '修改成功'
					}
					ress.jsonp(data);
				});
			} else {
				var end = ''
				if(fields.mediaType[0] == 0){
					end = '.jpg'
				}else if(fields.mediaType[0] == 1){
					end = '.mp4'
				}else if(fields.mediaType[0] == 2){
					end = '.mp3'
				}
				var filename = logs.randomname()
				var filepath = uploadDir + filename + end
				var readStream = fs.createReadStream(file.file[0].path);
				var writeStream = fs.createWriteStream('.' + filepath);
				readStream.pipe(writeStream);
				readStream.on('end', function() {
					fs.unlinkSync(file.file[0].path);
					var obj = {
						"name": fields.name[0],
						"remarks": fields.remarks[0],
						"sort": fields.sort[0],
						"typeId": fields.typeId[0],
						"tagIds": fields.tagIds.join(','),
						"mediaType": fields.mediaType[0], 
						"url": filepath,
						"fonts": ""
					}
					var updateStr = {
						$set: obj
					};
					dbo.collection("media").find(myobj).toArray(function (err, result) {
						if(result[0].url){
							fs.unlinkSync('.'+result[0].url);
							dbo.collection("type").updateOne(myobj, updateStr, function(err, res) {
						if(err) throw err;
						var data = {
							code: 200,
							msg: '修改成功'
						}
						ress.jsonp(data);
					});
						}
					})
					

				});
			}
		})

	})
	router.post('/delete',function(req,res,next){ 
			var arr=[]
			var ress = res
			var idarr = req.body.id.split(',')
			idarr.forEach(v=>{
				v = ObjectId(v)
				arr.push(v)
			})
			var myobj ={"_id":{$in:arr}};
			dbo.collection("media").find(myobj).toArray(function (err, result) {  //删除图片
				result.forEach(a=>{
					if(a.url){
						fs.unlinkSync('.'+a.url);
					}
				})
			})
			dbo.collection("media").deleteMany(myobj, function(err, obj) {
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