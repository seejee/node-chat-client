module.exports = function(options) {
  var student = null;
  var teacher = null;

  if(options.mode == "ping") {
    if(!options.url) {
      options.url = 'ws://localhost:3000';
    }

    var ping = require('./ping')(options);

    for(var i = options.idStart + 1; i <= options.idStart + options.numTeachers; i++) {
      ping.start(i, function() {
        process.exit();
      });
    }
  }
  else {
    if(options.mode == "node") {
      if(!options.url) {
        options.url = 'ws://localhost';
      }

      student = require('./node/student')(options);
      teacher = require('./node/teacher')(options);
    }

    if(options.mode == "elixir") {
      if(!options.url) {
        options.url = 'ws://localhost:4000/ws';
      }

      student = require('./elixir/student')(options);
      teacher = require('./elixir/teacher')(options);
    }

    for(var i = options.idStart + 1; i <= options.idStart + options.numTeachers; i++) {
      teacher.start(options.url, i, function() {
        process.exit();
      });
    }

    setTimeout(function() {
      doneCounter = 0;

      for(var i = options.idStart + 1; i <= options.idStart + options.numStudents; i++) {
        student.start(options.url, i, function() {
          doneCounter++;

          if(doneCounter == options.numStudents) {
            process.exit();
          }
        });
      }
    }, 100);
  }
}
