var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";
var fs = require('fs');
var dbo = ''
var outres = ''
router.use(bodyParser.urlencoded({
	extended: false
}));
router.use(bodyParser.json());
MongoClient.connect(url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}, function(err, db) {
	if(err) throw err;
	dbo = db.db("React"); //选择数据库
	router.get('/list', function(req, res, next) { //查询题库列表
		var limp = Number(req.query.size)
		var skip = (req.query.page - 1) * limp
		var myobj = {}
		var totalarr = []
		var otherres = res
		if(req.query.content != '' && req.query.content != null) {
			var str="^.*"+req.query.name+".*$"
    		var reg = new RegExp(str)
			myobj.name = reg
		}
		if(isNaN(limp)){
			skip = 0
			limp = 0
			myobj = {}
		}
		dbo.collection("testbank").find(myobj).count(function(err, result) {  
			var num = result
			dbo.collection("testbank").find(myobj).limit(limp).skip(skip).toArray(function(err, result) {
				totalarr = result
				var pList = []
				for(var i = 0; i < totalarr.length; i++) {
					(function(i) {
					pList.push(new Promise(function(resolve, reject) {
						let qtype = totalarr[i].qtype
						let anstype = totalarr[i].anstype
						let tag = []
						totalarr[i].tagIds.forEach(a=>{
							a = ObjectId(a)
							tag.push(a)
						})
						totalarr[i].key = i
						dbo.collection("dictdeatil").find({
							"name": "q_type",
							"value": qtype
						}).toArray(function(err, results) {
					
							totalarr[i].qtypeName = results[0].label
							dbo.collection("dictdeatil").find({
								"name": "ans_type",
								"value": anstype
							}).toArray(function(err, aresults) {
							
								if(aresults.length !=0){
									totalarr[i].anstypeName = aresults[0].label
								}else{
									totalarr[i].anstypeName = ''
								}
								dbo.collection("label").find({
										"_id": {
											$in: tag
										}
									}).toArray(function(err, tagresult) {
										let labelname = []
										tagresult.forEach(v => {
											labelname.push(v.name)
										})
										totalarr[i].tagName = labelname.join(',')
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
	router.post('/add',function(req,res,next){  //添加题库第一步
		var myobj = req.body
		var ress = res
		var tid = {"tid":req.body.tid};
		outres = res
		if(req.body.tid == '' || req.body.tid == null){
			delete myobj.tid
			dbo.collection("testbank").insertOne(myobj,function(err, res) {
			if(err) throw err;
				var data={
					code: 200,
					data:res.insertedId,
					msg:'添加成功'
				}
			ress.jsonp(data);
			})
		}else{
			var id = {"_id":ObjectId(req.body.tid)};
			delete myobj.tid
			dbo.collection("testbank").find(id).toArray(function(err,result){
				let tags = result[0].tagIds  //标签更改，清空题标签库
				let qtype = result[0].qtype  //题改成填空题，就要清空题选项库和题标签库
				let anstype = result[0].anstype  //选项变更，则要清空选项库和题标签库
				let flag = false
				if(qtype != myobj.qtype){
					if(myobj.qtype == 2){
						flag = true  //这个地方要用primose
						delimg(id,myobj,tid,myobj.qtype)

					}else{
						flag = false
						//放行
					}
				}
				if(!flag && anstype != myobj.anstype){
					flag = true
					if(myobj.anstype == 0){
						delimg(id,myobj,tid,myobj.qtype)
					}else{
						deltwobank(id,myobj,tid,myobj.qtype)
					}
					//清空两个库，直接修改返回
				}else{
					flag = false
					//放行
				}
				if(!flag){
					let outflag = true
					tags.forEach(v=>{
						let tflag = true
						myobj.tagIds.forEach(a=>{
							if(v == a){
								tflag = false
							}
						})
						if(tflag){
							outflag = false
						}
					})
					if(!outflag){
						deltagbank(id,myobj,tid,myobj.qtype)
						//清空题标签库，直接修改
					}else{
						update(id,myobj,myobj.qtype)
						//调修改方法
					}
				}
			})
			
		}
		
	})
	router.get('/detail',function(req,res,next){  //根据题库id查询题目、题目类型和选项
		var myobj ={"_id":ObjectId(req.body.id)};
		
	})
	router.get('/detailoption',function(req,res,next){  //查询选项
		var myobj ={"tid":req.query.id};
		dbo.collection("option").find(myobj).toArray(function(err, result) {
				var data = {
					code: 200,
					data: result
				}
				res.jsonp(data)
		})
	})
	router.get('/detailtag',function(req,res,next){  //查询选项标签
		var myobj ={"tid":req.query.id};
		var optiondata = []
		dbo.collection("option").find(myobj).toArray(function(err,results){
			optiondata = results
			dbo.collection("optiontag").find(myobj).toArray(function(err, result) {
				var data = {
					code: 200,
					data: {
						"optiondata":optiondata,
						"optiontagdata":result
					}
				}
				res.jsonp(data)
			})
		})
		
	})
	router.post('/addoptions',function(req,res,next){  //添加和修改选项
		var myobj = req.body
		var ress = res
		var tid = ObjectId(req.body.tid)
		var optiondata = JSON.parse(req.body.optiondata)
		var deliddata = []
		if(req.body.delid != ''){
			deliddata = req.body.delid.split(',')
		}else{
			deliddata = []
		}
		var pList = []
		for(let i = 0; i<optiondata.length;i++){
		   (function(i) {
		   pList.push(new Promise(function(resolve, reject) {
		   		let newobj = {
		   			'tid':myobj.tid,
		   			'option':optiondata[i].option,
		   		}
		   		if(optiondata[i]._id != undefined){
		   			var updateStr = {$set:newobj};
		   			var optionid = {'_id':ObjectId(optiondata[i]._id)}
		   			dbo.collection("option").updateOne(optionid,updateStr,function(err, res) {
		   				if(err) throw err;
		   				resolve()
		   			})
		   		}else{
		   			dbo.collection("option").insertOne(newobj,function(err, res) {
		   				if(err) throw err;
		   				resolve()
		   			})
		   		}
		   			
		   }))
		   })(i);	
		}
		Promise.all(pList).then(function(res) {
			dbo.collection("testbank").find({'_id':tid}).toArray(function(err, result) {
				var tagdata = result[0].tagIds
				var anstype = result[0].anstype
				console.log(anstype)
				var taglist = []
				var resultlable = []
				for(let i=0;i<tagdata.length;i++){
					(function(i){
						taglist.push(new Promise(function(resolve,reject){
							dbo.collection("label").find({'_id':ObjectId(tagdata[i])}).toArray(function(err, result) {
								resultlable.push(result[0])
								console.log(anstype)
								resolve()
							})	
						}))
					})(i)
				}
				Promise.all(taglist).then(function(res){
					if(deliddata.length != 0){
						var dellist = []
						deliddata.forEach(v=>{
							let id = ObjectId(v)
							dellist.push(id)
						})
						console.log(anstype)
						if(anstype == 1){
							var imgarr = []
							console.log(deliddata)
							for(let i=0;i<deliddata.length;i++){
								(function(i){
									imgarr.push(new Promise(function(resolve,reject){
										console.log(deliddata[i])
										dbo.collection("option").find({'_id':ObjectId(deliddata[i])}).toArray(function(err, resultimg) {
										
											fs.unlinkSync('.'+resultimg[0].option);
											resolve(resultimg[0].option)
										})	
									}))
								})(i)
							}
							Promise.all(imgarr).then(function(res){
								let imgobj = {"url":{$in: res}}
								dbo.collection("testimg").deleteMany(imgobj, function(err, obj) {
									if (err) throw err;
									
									var myobj ={"_id":{$in:dellist}};
						var optiontag = {"optionid":{$in:deliddata}}
						dbo.collection("option").deleteMany(myobj, function(err, obj) {
							if (err) throw err;
							dbo.collection("optiontag").deleteMany(optiontag, function(err, obj) {
								if (err) throw err;
								var data={
									code: 200,
									data:resultlable,
									msg:'添加成功'
								}
								ress.jsonp(data);
							})		
						});
								})
								
							})
						}else{
							var myobj ={"_id":{$in:dellist}};
						var optiontag = {"optionid":{$in:deliddata}}
						dbo.collection("option").deleteMany(myobj, function(err, obj) {
							if (err) throw err;
							dbo.collection("optiontag").deleteMany(optiontag, function(err, obj) {
								if (err) throw err;
								var data={
									code: 200,
									data:resultlable,
									msg:'添加成功'
								}
								ress.jsonp(data);
							})		
						});
						}
						
					}else{
						var data={
							code: 200,
							data:resultlable,
							msg:'添加成功'
						}
						ress.jsonp(data);	
					}
					
				})
			})	
								
		})	
	})
	router.post('/addoptiontag',function(req,res,next){  //添加和修改选项标签
		var myobj = req.body
		var ress = res
		var optiontagdata = JSON.parse(req.body.optiontagdata)
		var pList = []
		var p = new Promise(function(resolve,reject){
			var combination = []
			optiontagdata.forEach(v=>{
				v.tag.forEach(a=>{
						let plistobj = {
							"tid":myobj.tid,
							"option":v.option,
							"optionid":v._id,
							"optiontagname":a.name,
							"optiontagvalue":a.value,
							"optiontagid":a._id,
							"_id":a.id
						}
						combination.push(plistobj)
				})
			})
			resolve(combination)
		})
		p.then(res=>{
			for(let i = 0;i<res.length;i++){
			(function(i){
				pList.push(new Promise(function(resolve,reject){
					if(res[i]._id != undefined){
						let tagid = {'_id':ObjectId(res[i]._id)}
						delete res[i]._id
						let updateStr = {$set:res[i]};
						dbo.collection("optiontag").updateOne(tagid,updateStr,function(err, res) {
		   					if(err) throw err;
		   					resolve()
		   				})
					}else{
						delete res[i]._id
						dbo.collection("optiontag").insertOne(res[i],function(err, res) {
							if(err) throw err;
							resolve()	
						})
					}
					
				}))
			})(i)
		}
		Promise.all(pList).then(res=>{
			var data={
				code: 200,
				msg:'添加成功'
			}
			ress.jsonp(data);
		})
		})
	})
	router.post('/delete',function(req,res,next){  //删除题目，同时删除所属的标签选项
			var arr=[]
			var ress = res
			var idarr = req.body.id.split(',')
			var p = new Promise(function(resolve,reject){
				idarr.forEach(v=>{
					let a = ObjectId(v)
					arr.push(a)
					dbo.collection("testbank").find({'_id':a}).toArray(function(err, result) {
						let anstype = result[0].anstype
						if(anstype == 1){
							dbo.collection("option").find({'tid':v}).toArray(function(err, results) {
								let imgdata = []
								results.forEach(w=>{
									imgdata.push(w.option)
								})
								let imgobj = {"url":{$in: imgdata}}
								dbo.collection("testimg").deleteMany(imgobj, function(err, obj) {
									if (err) throw err;
									results.forEach(s=>{
										fs.unlinkSync('.'+s.option);
									})
									resolve()
								})
							})
						}else{
							resolve()
						}
					})
				})
			})
			p.then(res=>{
				var myobj ={"_id":{$in:arr}};
				var tids = {"tid":{$in:idarr}}
				dbo.collection("testbank").deleteMany(myobj, function(err, obj) {
					if (err) throw err;
					dbo.collection("option").deleteMany(tids, function(err, obj) {
						if (err) throw err;
							dbo.collection("optiontag").deleteMany(tids,function(err,obj){
								if(err) throw err;
									var data={
										code: 200,
										msg:'删除成功'
									}
									ress.jsonp(data);
							})
						});		
				});
			})			
	})
})
function deltwobank(id,myobj,tid,type){  //清空两个库函数
//	let imgobj = {"url":{$in: imgdata}}
	dbo.collection("option").deleteMany(tid, function(err, obj) {
		if (err) throw err;
		dbo.collection("optiontag").deleteMany(tid,function(err,obj){
			if(err) throw err;
			update(id,myobj,type)
		})
	});
}
function deltagbank(id,myobj,tid,type){ //清空选项标签库函数
	dbo.collection("optiontag").deleteMany(tid,function(err,obj){
		if(err) throw err;
		update(id,myobj,type)
	})
}
function update(id,myobj,type){  //更新第一步数据函数
	if(myobj.qtype == 2){
		delete myobj.anstype
	}
	var updateStr = {$set:myobj};
	dbo.collection("testbank").updateOne(id, updateStr, function(err, res) {
		if (err) throw err;
			var data={
				code: 200,
				data:id._id,
				msg:'修改成功'
			}
			if(type == 2){
				data.data = ''
			}
			outres.jsonp(data);  
	});
}

function delimg(id,myobj,tid,type){  //删除图片
	var p = new Promise((resolve, reject) => {
		
	dbo.collection("option").find(tid).toArray(function(err, results) {
		let imgdata = []
		
		results.forEach(w=>{
			imgdata.push(w.option)
			fs.unlinkSync('.'+w.option);
		})
		
		let imgobj = {"url":{$in: imgdata}}
		dbo.collection("testimg").deleteMany(imgobj, function(err, obj) {
			if (err) throw err;
			resolve(true)
		})
	})
	})
	p.then(res=>{
		deltwobank(id,myobj,tid,type)
	})
}
module.exports = router