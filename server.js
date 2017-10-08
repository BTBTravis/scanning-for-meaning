var app = require('express')();
var http = require('http').Server(app);
var rp = require('request-promise');
var Datastore = require('nedb')
  , db = new Datastore({ filename: 'wiki_pulls', autoload: true });



var random_pool = [];
var requested_pool = [];
var current_article;

//history returns the last ten results in the db
app.get('/history', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  db.find({}).sort({ displayed: -1 }).limit(10).exec(function (err, docs) {
    console.log({action:"history", docs:docs});
    res.send(JSON.stringify(docs));
  });
});

app.get('/new', function(req, res){
  //res.send('<h1>Hello world</h1>');
  if(requested_pool.length > 0){

  }
  else if(random_pool.length == 0) topOffRandom();
  else{
    current_article = random_pool[0];
    current_article.displayed = new Date();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(current_article));
    random_pool.splice(0, 1);
    db.insert(current_article, function (err, newDoc) {
      console.log(newDoc);
    });
  }
  topOffRandom();

  // db.insert(doc, function (err, newDoc) {
  //   console.log(newDoc);
  // });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

topOffRandom();

function topOffRandom() {
  var need = 5 - random_pool.length;
  for (var i = 0; i < need; i++) {
    getRandom();
  }
}
function getRandom() {
  var options = {
    uri: 'https://en.wikipedia.org/api/rest_v1/page/random/summary',
    // qs: {
    //   access_token: 'xxxxx xxxxx' // -> uri + '?access_token=xxxxx%20xxxxx'
    // },
    headers: {
      'User-Agent': 'image_scanning_art_thing',
      'Accept': 'application/json'
    },
    json: true // Automatically parses the JSON string in the response
  };

  rp(options)
    .then(function (r) {
      if (!('thumbnail' in r)) topOffRandom();
      else{
        console.log('Topping off random_pool with ' + r.title);
        random_pool.push({
          title: r.title,
          pageid: r.pageid,
          description: r.description,
          thumb: r.thumbnail.source,
          originalimage: r.originalimage,
          recived: new Date()
        });
      }
    })
    .catch(function (err) {
      console.log("ERR");
      console.log({err:err});
    });
}
