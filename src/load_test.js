module.exports = function(options) {
  var student = null;
  var teacher = null;

  if(options.mode == "node")
  {
    if(!options.url) {
      options.url = 'http://localhost:4000';
    }

    student = require('./node/student')(options);
    teacher = require('./node/teacher')(options);
  }
  else {
    if(!options.url) {
      options.url = 'ws://localhost:4000/ws';
    }

    student = require('./elixir/student')(options);
    teacher = require('./elixir/teacher')(options);
  }

  for(var i = 1; i <= options.numTeachers; i++) {
    teacher.start(i);
  }

  setTimeout(function() {
    for(var i = 1; i <= options.numStudents; i++) {
      student.start(i);
    }
  }, 100);
}
