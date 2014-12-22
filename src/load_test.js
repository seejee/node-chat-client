var faye    = require('faye');

module.exports = function(options) {
  var url = options.url;

  var student = require('./student')(options);
  var teacher = require('./teacher')(options);

  teacher.start(1);
  student.start(100);
}
