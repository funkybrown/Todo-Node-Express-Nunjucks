var MongoClient = require('mongodb').MongoClient;

exports.list = function(req, res, next){
  MongoClient.connect(req.uri, function(err, db) {
    if (err) return next(err);
    var collection = db.collection('tasks');
    collection.find({completed: false}).toArray(function(err, docs) {
    db.close();
    console.info(docs);
    res.render('tasks', {
      title: 'Todo List',
      tasks: docs || []
      });
    });
});
};

exports.add = function(req, res, next){

  if (!req.body || !req.body.name) return next(new Error('No data provided.'));

  MongoClient.connect(req.uri, function(err, db) {
    var collection = db.collection('tasks');
    var d = req.body;
    d.createTime = new Date();
    d.completed = false;
    collection.insertOne(req.body);
    db.close();
    res.redirect('/tasks');
 });
};


exports.markAllCompleted = function(req, res, next) {
  if (!req.body.all_done || req.body.all_done !== 'true') return next();
  MongoClient.connect(req.uri, function(err, db) {
      var collection = db.collection('tasks');
      collection.update({
        completed: false
      }, {$set: {
        completeTime: new Date(),
        completed: true
      }}, {multi: true}, function(error, count){
        if (error) return next(error);
        console.info('Marked %s task(s) completed.', count);
        res.redirect('/tasks');
      })
  });
};

exports.completed = function(req, res, next) {
    MongoClient.connect(req.uri, function(err, db) {
      var collection = db.collection('tasks');
      collection.find({completed: true}).toArray(function(err, docs) {
        db.close();
        res.render('tasks_completed', {
          title: 'Completed',
          tasks: docs || []
        });
      });
    });
};

exports.markCompleted = function(req, res, next) {
  if (!req.body.completed) return next(new Error('Param is missing.'));
  var completed = req.body.completed === 'true';
  MongoClient.connect(req.uri, function(err, db) {
    var collection = db.collection('tasks');
    collection.updateOne({'_id': req.task._id}, 
      {$set: {completeTime: completed ? new Date() : null, completed: completed}}, function(error, count){
      if (error) return next(error);
      console.info('Marked task %s with id=%s completed.', req.task.name, req.task._id);
      res.redirect('/tasks');
    })
});
};

exports.del = function(req, res, next) {
  MongoClient.connect(req.uri, function(err, db) {
     var collection = db.collection('tasks');
     collection.deleteOne({'_id': req.task._id}, function(error, count){
        db.close();
        if (error) return next(error);
        if (count.deletedCount !==1) return next(new Error('Something went wrong.'));
        console.info('Deleted task %s with id=%s completed.', req.task.name, req.task._id);
        res.status(204).send();
     });
  });
};
