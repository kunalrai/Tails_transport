'use strict';

module.exports = function AppError(description, status, title, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = description;
  this.title = title;
  this.extra = extra;
  this.status = status;
  this.toJSON = function () {
    let result = {
      description: this.message,
    };
    if (this.title){
      result.title = this.title;
    }
    if (this.status){
      result.status = this.status;
    }
    return result;
  }
};

require('util').inherits(module.exports, Error);