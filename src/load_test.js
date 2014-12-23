module.exports = function(options) {
  var student = null;
  var teacher = null;

  if(options.nodeServer)
  {
    options.url = 'http://localhost:3000/faye';
    student = require('./node/student')(options);
    teacher = require('./node/teacher')(options);
  }
  else {
    options.url = 'ws://localhost:4000/ws';
    student = require('./elixir/student')(options);
    teacher = require('./elixir/teacher')(options);
  }

  for(var i = 1; i <= options.numTeachers; i++) {
    teacher.start(i);
  }

  for(var i = 1; i <= options.numStudents; i++) {
    student.start(i);
  }
}
