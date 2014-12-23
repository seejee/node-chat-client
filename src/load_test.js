module.exports = function(options) {
  var url = options.url;

  var student = null;
  var teacher = null;

  if(options.nodeServer)
  {
    student = require('./node/student')(options);
    teacher = require('./node/teacher')(options);
  }

  for(var i = 1; i <= options.numTeachers; i++) {
    teacher.start(i);
  }

  for(var i = 1; i <= options.numStudents; i++) {
    student.start(i);
  }
}
