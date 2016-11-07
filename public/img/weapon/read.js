var fs = require('fs');
fs.readdir('.', function(err, files){
    if (err) throw err;
    var fileList = [];
    files.filter(function(file){
        return fs.statSync(file).isFile() && /.*\.jpg$/.test(file); //絞り込み
    }).forEach(function (file) {
    	var txt = '<li class="origin"><img src="img/weapon/'+file+'" height="40" width="48"></li>'
        fileList.push(txt);
    });
    console.log(fileList);
}); 