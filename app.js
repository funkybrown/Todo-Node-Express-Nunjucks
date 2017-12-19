var express = require('express');
var routes = require('./routes');
var tasks = require('./routes/tasks');
var http = require('http');
var path = require('path');
var ObjectId = require('mongodb').ObjectID;
var nunjucks = require('nunjucks');

var MongoClient = require('mongodb').MongoClient;
var settings = require('./settings.json');

var app = express();

var favicon = require('serve-favicon'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  csrf = require('csurf'),
  errorHandler = require('errorhandler');


// not storing the collection in middleware as it doesnt seem to keep the collection object.
app.use(function(req, res, next) {
  //req.db = {};
  req.uri = settings.uri;
  //  req.collection = {};
  //MongoClient.connect(uri, function(err, db) {
    //var collection = db.collection('tasks');
    //collection.find({}).toArray(function(err, docs) {
    //req.db.tasks = docs;
    //req.collection = collection;
    //db.close();
    //});
//});
  next();
})

app.locals.appname = 'Express.js Todo App'
app.locals.moment = require('moment');

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(favicon(path.join('public','favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(cookieParser('CEAF3FA4-F385-49AA-8FE4-54766A9874F1'));
app.use(session({
  secret: '59B93087-78BC-4EB9-993A-A61FC844F6C9',
  resave: true,
  saveUninitialized: true
}));
app.use(csrf());

app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  /*
  res.locals
  An object that contains response local variables scoped to the request, and 
  therefore available only to the view(s) rendered during that request / response cycle (if any). 
  Otherwise, this property is identical to app.locals.
  
  This property is useful for exposing request-level information such as the request 
  path name, authenticated user, user settings, and so on.
  */
  res.locals._csrf = req.csrfToken();
  return next();
})

app.param('task_id', function(req, res, next, taskId) {
  MongoClient.connect(req.uri, function(err, db) {
    if (err) return next(err);
    var collection = db.collection('tasks');
    collection.findOne({_id: new ObjectId(taskId)}, function(error, oneTask) {
    db.close();
    if (error) return next(error);
    if (!oneTask) return next(new Error('Task is not found.'));
    req.task = oneTask;
    });
    return next();
  });
});


app.get('/', routes.index);
app.get('/tasks', tasks.list);
app.post('/tasks', tasks.markAllCompleted)
app.post('/tasks', tasks.add);
app.post('/tasks/:task_id', tasks.markCompleted);
app.delete('/tasks/:task_id', tasks.del);
app.get('/tasks/completed', tasks.completed);

app.all('*', function(req, res){
  res.status(404).send();
})
// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
