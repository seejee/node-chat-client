var faye    = require('faye');

module.exports = function(options) {
  var url = options.url;

  var student = require('./student')(options);
  var teacher = require('./teacher')(options);

  for(var i = 1; i <= 5; i++) {
    teacher.start(i);
  }

  for(var i = 1; i <= 500; i++) {
    student.start(i);
  }
}
