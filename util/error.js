/*
 *  Custom Error
 * */
function MyRequestError(name, status, param, message) {
  this.message = message;
  this.status = status;
  this.param = param;
  this.name = name;
  Error.captureStackTrace(this, MyRequestError);
}
MyRequestError.prototype = Object.create(Error.prototype);
MyRequestError.prototype.constructor = MyRequestError;

module.exports = {
    RequestError: MyRequestError
};
