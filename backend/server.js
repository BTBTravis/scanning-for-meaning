var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var rp = require('request-promise');
var bodyParser = require('body-parser');
var Jimp = require("jimp");

const util = require('util');//DEV_ONLY
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'db',
  port     : '3306',
  user     : 'sfm',
  password : 'f1f5e5fe8e8h8i8o8gf8we4w',
  database : 'scanning_for_meaning'
});
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
//CORS https://enable-cors.org/server_expressjs.html
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


var random_pool = [];
var requested_pool = [];
var current_article;
var scanned_count = 0;


//first time user connects
io.on('connection', function(socket){
  console.log('a user connected');
  if(current_article) io.emit('current_article_update', current_article);//give this new user the current wiki article we are scanning
  //update the new users history with the last 10 itmes
  connection.query('SELECT * FROM wikipulls ORDER BY id DESC LIMIT 10 OFFSET 1', function (error, results, fields) {
    if (error) console.error(error);
    //console.log({action:"history", docs:results});
    io.emit('history', results);
  });
  connection.query("SELECT COUNT(*) AS 'count' FROM wikipulls ;", function (error, results, fields) {
    if (error) console.error(error);
    console.log({results:results});
    if(results !== undefined )  io.emit('count_update', results[0].count);
  });
  //log there disconnect...
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

//mock up for count_update
// setInterval(function(){
//   console.log('count_update: ' + scanned_count);
//   scanned_count++;
//   io.emit('count_update', scanned_count);
// }, 500);


//history the total plus 100
app.post('/more_history', function(req, res){
  // res.setHeader('Content-Type', 'application/json');
  // if(! isNaN(req.query.current_total)){
  //   res.send(req.query);
  // }
  console.log({oldest: req.body.oldest});
  // req.params.current_count
  connection.query('SELECT * FROM `wikipulls` WHERE displayed < ? ORDER BY `displayed` DESC LIMIT 10 OFFSET 1', [new Date(req.body.oldest.displayed)], function (error, results, fields) {
    if (error) console.error(error);
    console.log({action:"db_more_history", results:results});
    res.send(results);
  });
});
app.get('/new', function(req, res){
  newArticle();
  res.send('got message');
});
var new_article_timmer;
function newArticle(){
  current_article = random_pool[0];
  current_article.displayed = new Date();
  //track math
  var track = [];
  const vpw = 18;//view port width
  const vph = 10;//view port height
  const ogw = current_article.originalimage_width;
  const ogh = current_article.originalimage_height;
  const x_steps = Math.floor(ogw/vpw) - 1;
  const y_max = ogh - vph;
  for (var i = x_steps; i > 0; i--) {
    var x = i * vpw;
    for (var j = y_max; j > 0; j--) {
      track.push([x,j]);
    }
  }
  current_article.track = track;
  let timeout_length = track.length * 25 - 3000;
  io.emit('current_article_update', current_article);
  random_pool.splice(0, 1);
  //TODO: format article to be saved...
  current_article.keys
  let insertable_article = {};
  insertable_article.id = current_article.id;
  insertable_article.title = current_article.title;
  insertable_article.pageid = current_article.pageid;
  insertable_article.description = current_article.description;
  insertable_article.thumb = current_article.thumb;
  insertable_article.recived = current_article.recived;
  insertable_article.displayed = current_article.displayed;
  var query = connection.query('INSERT INTO `wikipulls` SET ?', insertable_article, function (error, results, fields) {
    if (error) console.error(error);
    console.log({insert_results:results});
    // Neat!
  });
  // console.log(query.sql); // INSERT INTO posts SET `id` = 1, `title` = 'Hello MySQL'
  clearTimeout(new_article_timmer);
  new_article_timmer = setTimeout(() => {
    newArticle();
  }, timeout_length);

  topOffRandom();
  connection.query('SELECT * FROM wikipulls ORDER BY id DESC LIMIT 10 OFFSET 1', function (error, results, fields) {
    if (error) console.error(error);
    // console.log({action:"history", docs:results});
    io.emit('history', results);
  });
  connection.query("SELECT COUNT(*) AS 'count' FROM wikipulls ;", function (error, results, fields) {
    if (error) console.error(error);
    console.log({results:results});
    io.emit('count_update', results[0].count);
  });
}

http.listen(3001, function(){
  console.log('listening on *:3001');
});

//___START UP___

setTable()
.then(function () {
  return topOffRandom();
})
.then(function () {
  newArticle();//now that we got table start the article auto play cycle...
  console.log("Finished Topping Off");
})
.catch(function (err) {
  console.log("STARTUP ERR");
  console.log(err);
})
//create table if it does not already exist



//___END START UP___

function setTable() {
  return new Promise(function (resolve) {
    connection.query('CREATE TABLE wikipulls (\
      id INT(11) NOT NULL AUTO_INCREMENT  PRIMARY KEY,\
      title VARCHAR(280) NOT NULL,\
      pageid INT(11) NOT NULL,\
      description TEXT NULL,\
      thumb VARCHAR(280) NOT NULL,\
      recived TIMESTAMP NULL,\
      displayed TIMESTAMP NULL );',
      function (error, results, fields) {
        if (error) {
          console.log(error);
          // return setTimeout(function () {
          //   setTable();
          // }, 5000);
        }
        console.log({results:results, fields:fields});
        resolve();
      }
    );
  });
}

function topOffRandom() {
  // return new Promise(function (resolve) {
    var need = 5 - random_pool.length;
    var article_promises = [];
    for(var i = 0; i < need; i++){
      var p = getRandomArticle()
        .then(function (article) {
          return processArticle(article);
        })
        .then(function (article) {
          // console.log({final_article:article});
          random_pool.push(article);
        });
      article_promises.push(p);
    }

  //  });
   return Promise.all(article_promises);
}


function getRandomArticle() {
    return new Promise(function (resolve) {
        var options = {
          uri: 'https://en.wikipedia.org/api/rest_v1/page/random/summary',
          headers: {
            'User-Agent': 'image_scanning_art_thing',
            'Accept': 'application/json'
          },
          json: true // Automatically parses the JSON string in the response
        };
        rp(options).then(function (r) {
          //validate new article
          var skip = false;
          var req_keys = ['title', 'pageid', 'description', 'thumbnail', 'originalimage'];
          for (var i = 0; i < req_keys.length; i++) {
            if (typeof r[req_keys[i]] == 'undefined') skip = true;
            else if(r[req_keys[i]] == null) skip = true;
            else if (/\.svg/.test(r.originalimage.source)) skip = true;
            else if (/\.png/.test(r.originalimage.source)) skip = true;
            else if (/\.tiff/.test(r.originalimage.source)) skip = true;
            else if (/\.tif/.test(r.originalimage.source)) skip = true;
            else if(r.originalimage.width < 300 || r.originalimage.height < 250) skip = true;
          }
          if (skip) resolve(false);
          else resolve(r);
        })
    })
    .then(function (article) {
        if(article) console.log("found article with title : " + article.title);
        else console.log("did not find article trying again");
        return article ? article: getRandomArticle();
    })
}


function processArticle(article) {
  return new Promise(function (resolve) {
    if(article.originalimage.width > 500){
      console.log("processing with downscaling for" + article.title);
      Jimp.read(article.originalimage.source).then(function (img) {
        img.resize(500, Jimp.AUTO)
         .quality(60)
        const new_height = img.bitmap.height;
        const new_width = img.bitmap.width;
        img.getBase64(Jimp.AUTO, function (err, img_64) {
          resolve({
           title: article.title,
           pageid: article.pageid,
           description: article.description,
           thumb: article.thumbnail.source,
           originalimage_source: img_64,
           originalimage_height: new_height,
           originalimage_width: new_width,
           recived: new Date(),
          });
        });
      })
    }else{
      console.log("processing for" + article.title);
      resolve({
        title: article.title,
        pageid: article.pageid,
        description: article.description,
        thumb: article.thumbnail.source,
        originalimage_source: article.originalimage.source,
        originalimage_height: article.originalimage.height,
        originalimage_width: article.originalimage.width,
        recived: new Date()
      });
    }
  });
}

