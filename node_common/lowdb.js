"use strict";

import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as Strings from "~/common/strings";
import * as Exception from "~/common/exception";

const path = require("path");
import low from "lowdb";
import shortid from "shortid"; 
import FileSync from "lowdb/adapters/FileSync";

const LOWDB = "LOWDB           ";

const lowDbFile = path.join(process.cwd(), path.normalize(Environment.LOWDB_FILE_PATH));

const adapter = new FileSync(lowDbFile);
const db = low(adapter);
let obj = { app: [] };
db.defaults(obj).write();

export const getAppList = () => {
  const appList = db.get("app").value();
  ScriptLogging.log(LOWDB, `${JSON.stringify(appList)}`);
  return appList;
};

export const insertApp = (app) => {
   console.log(app); 

   const userAgent = app.userAgent; 
   const userAppId = shortid.generate(); 

   const insertApp = {
    // appId: appCnt + 1,
    appId: userAppId, 
    userAgent: userAgent, 
    url : `${Environment.HOST_ROOT}${userAppId}`, 
    date: Strings.nowDateTime(),
  };
  db.get("app").push(insertApp).write();

  ScriptLogging.log(LOWDB, `insert ${JSON.stringify(insertApp)}`);
  return insertApp;
};

export const getApp = (appId) => {

  const app = db
    .get("app")
    .find({ appId: appId })
    .value();

    if ( app === null || app === undefined) { 
      throw Exception.notExistException("appId"); 
    }

  ScriptLogging.log(LOWDB, `${JSON.stringify(app)}`);

  return app;
};

export const removeApp = (appId) => {
  if (Strings.isEmpty(appId)) {
    throw Exception.badRequestException("appId value is empty");    
  }
  
  const app = db.get("app").find({ appId: appId }).value();
  if ( app === null || app === undefined) { 
    throw Exception.notExistException("appId"); 
  }

  db.get("app")
    .remove({ appId: appId })
    .write();

  ScriptLogging.log(LOWDB, `remove ${appId}`);
  return appId; 

};

export const updateApp = (appId, reqApp) => {

   if (Strings.isEmpty(appId)) {
    throw Exception.badRequestException("appId value is empty");        
  }

  let app = db.get("app").find({ appId: appId }).value();
  if ( app === null || app === undefined) { 
    throw Exception.notExistException("appId"); 
  }

  app = db
    .get("app").find({ appId: appId }).assign
    ({ 
      userAgent: reqApp.userAgent, 
      date: Strings.nowDateTime()      
    })
    .write();
  ScriptLogging.log(LOWDB, `update ${app}`);
  return app; 
};
