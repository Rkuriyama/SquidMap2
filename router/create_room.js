var exxpress = require('express');
var router = express.Router();

router.post("/", function(req, res){
	console.log('create......');
	console.log(req.body);
	if(req.body.room　&& req.body.pass && req.body.name){
		var room = req.body.room;
		var pass = req.body.pass;
		var name = req.body.name;
		rooms[room] = {
			pass:pass,
			owner:name
		}

		req.session.room = room;
		req.session.name = name;
		//入力値の判定が必要
			console.log(rooms);
			res.render('squid_map',{
					room:room,
					name:name
			});
	}else{
	console.log('failed......');
	}
});

module.exports = router;
