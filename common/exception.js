"use strict";

export const notExistException = (message) => {
  const e = new Error();
  e.message = "Not Exists : " + message;
  e.status = 404;
  return e;
};

export const badRequestException = (message) => {
  const e = new Error();
  e.message = "Bad Request : " + message;
  e.status = 400;
  return e;
};


export const alreadyExistException = (message) => {
  const e = new Error();
  e.message = "Already Exist : " + message;
  e.status = 409;
  return e;
};

export const internalException = (message) => {
  const e = new Error();
  e.message = "Internal Exception  : " + message;
  e.status = 500;
  return e;
};
