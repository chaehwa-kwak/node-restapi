"use strict";

const url = require("url");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("formdata");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const uploadFile = require("../../config/upload");
const config = require("../../config/const");
const exception = require("../common/exception");

const lowDbFile = path.join(
  process.cwd(),
  path.normalize(config.FILE_META_PATH)
);

const adapter = new FileSync(lowDbFile);
const db = low(adapter);
let obj = { app: [] };
db.defaults(obj).write();

const insertLowDB = (reqApp) => {
  const insertApp = {
    id: new Date().getTime(),
    title: reqApp.title,
    contents: reqApp.contents,
    date: new Date().toISOString(),
  };
  
  db.get("app").push(insertApp).write();

  const insertResult = findByIdLowDB(insertApp.id);
  console.log(insertResult);
  return insertResult;
};

const findAllLowDB = () => {
  const appList = db.get("app").value();
  console.log(appList);  
  return appList;
};

const findByIdLowDB = (reqId) => {
  const resApp = db
    .get("app")
    .find({ id: Number(reqId) })
    .value();
  console.log(resApp);
  return resApp;
};

const updateLowDB = (id, reqApp) => {
  if (findByIdLowDB(id) === undefined) {
    throw exception.notExistException(id);
  }
  const resApp = db
    .get("app")
    .find({ id: Number(id) })
    .assign({
      title: reqApp.title,
      contents: reqApp.contents,
      date: new Date().toISOString(),
    })
    .write();
    console.log(resApp);  

  return resApp;
};

const removeLowDB = (id) => {
  if (findByIdLowDB(id) === undefined) {
    throw exception.notExistException(id);
  }

  db.get("app")
    .remove({ id: Number(id) })
    .write();
};

module.exports = {
  insertLowDB,
  findAllLowDB,
  findByIdLowDB,
  updateLowDB,
  removeLowDB,
};
