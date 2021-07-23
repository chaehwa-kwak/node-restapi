"use strict";

const url = require("url");
const fs = require("fs");

import * as ScriptLogging from "~/node_common/script-logging";

const getAppList = async (req, res) => {
  console.log(`Req >> ${url.parse(req.url).path}`);
  try {
    const resAppList = await appService.findAllLowDB();

    res.status(200).send({
      result: successReturn(resAppList),
    });
  } catch (err) {
    ScriptLogging.error(ERROR, err.message);    

    res.status(err.status).send({
      err,
    });    
  }
};



const createApp = async (req, res) => {
  console.log(`Req >> ${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);
  const json = req.body;
  const app = new appModel.App(json.title, json.contents);

  try {
    const ceatedApp = await appService.insertLowDB(app);

    res.status(200).send({
      result: successReturn(ceatedApp),
    });
  } catch (err) {
    ScriptLogging.error(ERROR, err.message);    
    res.status(err.status).send({
      err,
    });
  }
};

const updateApp = async (req, res) => {
  console.log(`Req >> ${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const reqId = req.params.id;

  const reqApp = {};
  reqApp.title = req.body.title;
  reqApp.contents = req.body.contents;

  try {
    const updateApp = await appService.updateLowDB(reqId, reqApp);
    res.status(200).send({
      result: successReturn(updateApp),
    });
  } catch (err) {
    ScriptLogging.error(ERROR, err.message);    
    res.status(err.status).send({
      err,
    });
  }
};

const removeApp = async (req, res) => {
  console.log(`Req >> ${url.parse(req.url).path}`);
  const reqId = req.params.id;

  try {
    await appService.removeLowDB(reqId);

    res.status(200).send({
      result: successReturn(`complete remove ${reqId}`),
    });
  } catch (err) {
    ScriptLogging.error(ERROR, err.message);    
    res.status(err.status).send({
      err,
    });
  }
};



const getApp = async (req, res) => {
  console.log(`Req >> ${url.parse(req.url).path}`);
  const reqId = req.params.id;

  try {
    const resApp = await appService.findByIdLowDB(reqId);

    if (resApp === undefined) {
      throw exception.notExistException(reqId);
    }
    res.status(200).send({
      result: successReturn(resApp),
    });
  } catch (err) {
    ScriptLogging.error(ERROR, err.message);    
    res.status(err.status).send({
      err,
    });
  }
};

module.exports = {
  createApp,
  getAppList,
  getApp,
  updateApp,
  removeApp,
};
