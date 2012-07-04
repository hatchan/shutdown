var isShutdown = false;
var isShuttingDown = false;
var counter = 0;
var tasks = [];

var handleShutdown = function (req, res, next) {
  "use strict";
  if (!isShutdown && !isShuttingDown) {
    // see if there are any running tasks
    isShuttingDown = true;
  }

  if (tasks.length === 0) {
    isShutdown = true;
  }

  if (isShutdown) {
    res.json({
      'success':true,
      'data':{'pending':false, 'shutdown':true }
    }, 200);
  }
  else if (isShuttingDown) {
    res.json({
      'success':true,
      'data':{'pending':true, 'shutdown':false }
    }, 202);
  }
};

var middleware = function (options) {
  "use strict";
  var options = options || {};
  if (!options.secret) {
    throw new Error('A \'secret\' is required for security');
  }

  return function (req, res, next) {
    if (/^\/_shutdown/.test(req.url)) {
      if (req.query.secret !== options.secret) {
        handleShutdown(req, res, next);
      }
      else {
        res.end(403);
      }
    }
    else {
      next();
    }
  }
};

var registerTask = function(name) {
  "use strict";
  if (isShuttingDown || isShutdown) {
    throw new Error('Process is shutting down or is already shutdown');
  }

  var task = {
    'id': counter++,
    'name': name
  };

  tasks.push(task);

  var callback = function() {
    var idx = tasks.indexOf(task); // Find the index
    if(idx !== -1) {
      tasks.splice(idx, 1);
    }
  };

  return callback;
};

var reset = function() {
  "use strict";
  tasks.splice(0, tasks.length);
  isShutdown = false;
  isShuttingDown = false;
};

module.exports = {
  'middleware':middleware,
  'registerTask':registerTask,
  'reset': reset,
  'isShutdown': function() {return isShutdown;},
  'isShuttingDown': function() {return isShuttingDown;}
};