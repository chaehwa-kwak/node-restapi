"use strict";

import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as Lowdb from "~/node_common/lowdb";
import * as LowdbO2Plus from "~/node_common/lowdb-o2plus";
import * as Strings from "~/common/strings";
import * as UploadO2 from "~/node_common/upload-o2";
import * as UploadO2Plus from "~/node_common/upload-o2plus";
import * as Serializers from "~/node_common/serializers";
import * as Lotus from "~/node_common/lotus";
import * as Utilities from "~/node_common/utilities";

import APIRouteIndex from "~/pages";

import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";

import fs from "fs";
import mkdirp from "mkdirp";
import mime from "mime";

import url from "url";
import path from "path";


const server = express();
const MYLINK = "SERVER START    ";
const ROUTE = "ROUTE           ";
const UPLOAD = "UPLOAD           ";
const DOWNLOAD = "DOWNLOAD         ";
const ERROR = "ERROR           ";



server.use(bodyParser.json({ limit: "50mb" }));
server.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
server.use(morgan("dev")); // log every request to the console

server.use(express.static(path.join(__dirname, 'public'))); // rgo 사이트 경로

server.use(cors());
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs'); // set up ejs for templating
server.get("/favicon.ico", (req, res) => res.status(204));


server.get("/", async (req, res) => {
  return await APIRouteIndex(req, res);
});

/**
 * page generate url 
 */
server.get('/_generate', function (req, res) {

  console.log("UploadO2.indexJson : ", UploadO2.indexJson);   
  req.app.keyword = UploadO2.indexJson.keyword;
  req.app.author = UploadO2.indexJson.author;

  let appTitle = UploadO2.indexJson.title; 

  if(Strings.isEmpty(appTitle)) appTitle = "마이링크"; 
  req.app.title = appTitle;
  req.app.description = UploadO2.indexJson.description;

  req.app.slide = UploadO2.indexJson.slide; 
  req.app.homeUrl = UploadO2.generateUrl; 

  res.render('index.ejs', {
    app: req.app
  });
});


/**
 * upload zip file & extract & generate index.html
 */
server.post("/v1/o2/upload", async (req, res) => {
  req.setTimeout(0);

  const reqApp = {
    userAgent: req.header('User-Agent')
  }; 
  let retApp = {}; 

  try {
    retApp = await Lowdb.insertApp(reqApp);
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    return res.status(err.status).send({
      err,
    });
  }
  
   await UploadO2.uploadZipFile(req, res, retApp.appId);
  
});


server.get("/v1/o2", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path}`);

  let appList = {};

  appList = await Lowdb.getAppList();

  return res.status(200).json({
    decorator: "MyLink App List",
    data: {
      appList,
    },
  });
});


server.get("/v1/o2/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  const appId = req.params.appId;
  try {
    const app = await Lowdb.getApp(appId);
    return res.status(200).json({
      decorator: `MyLink App ${appId}`,
      data: {
        app,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

server.put("/v1/o2/:appId", async (req, res) => {
    req.setTimeout(0);
    ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

    const reqApp = {
        userAgent: req.header('User-Agent')
    }; 
    const usedrAppId = req.params.appId; 

    let retApp = {}; 
    
    try {
    retApp = await Lowdb.updateApp(usedrAppId, reqApp);
    } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    return res.status(err.status).send({
        err,
    });
    }
    
    await UploadO2.uploadZipFile(req, res, retApp.appId);
    
  });
  



server.delete("/v1/o2/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  try {
    const appId = req.params.appId;

    const retAppId = await Lowdb.removeApp(appId);
    await UploadO2.removeApp(appId);

    return res.status(200).json({
      status: 200, 
      data: `Remove appId : ${retAppId}`,
    });
    
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

///////////////// o2 plus
/**
 * upload file 
 */
server.post("/v1/o2plus/upload", async (req, res) => {
  req.setTimeout(0);

  const reqApp = {
    userAgent: req.header('User-Agent')
  }; 
  let retApp = {}; 

  try {
    retApp = await LowdbO2Plus.insertApp(reqApp);

    const appHpmePath = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), retApp.appId );

    if (!fs.existsSync( appHpmePath )) {
      await mkdirp( appHpmePath )
        .then(made =>
          ScriptLogging.log(UPLOAD, `made directoriy : ${made}`));
    } 


  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    return res.status(err.status).send({
      err,
    });
  }
  
   await UploadO2Plus.uploadFile(req, res, retApp.appId);
  
});


server.get("/v1/o2plus", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path}`);

  let appList = {};

  appList = await LowdbO2Plus.getAppList();

  return res.status(200).json({
    decorator: "MyLink App List",
    data: {
      appList,
    },
  });
});


server.get("/v1/o2plus/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  const appId = req.params.appId;
  try {
    const app = await LowdbO2Plus.getApp(appId);
    return res.status(200).json({
      decorator: `MyLink App ${appId}`,
      data: {
        app,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


server.get("/v1/o2plus/cid/:cid", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.cid} `);

  const cid = req.params.cid;
  try {
    const app = await LowdbO2Plus.getAppByCid(cid);
    return res.status(200).json({
      decorator: `MyLink App cid : ${cid}`,
      data: {
        app,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


server.put("/v1/o2plus/:appId", async (req, res) => {
    req.setTimeout(0);
    ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

    const reqApp = {
        userAgent: req.header('User-Agent')
    }; 
    const usedrAppId = req.params.appId; 

    let retApp = {}; 
    
    try {
    retApp = await LowdbO2Plus.updateApp(usedrAppId, reqApp);
    
    } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    return res.status(err.status).send({
        err,
    });
    }
    
    await UploadO2Plus.uploadFile(req, res, retApp.appId);
    
  });
  



server.delete("/v1/o2plus/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  try {
    const appId = req.params.appId;

    const retAppId = await LowdbO2Plus.removeApp(appId);
    await UploadO2Plus.removeApp(appId);

    return res.status(200).json({
      status: 200, 
      data: `Remove appId : ${retAppId}`,
    });
    
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

// lotus client list-deals
server.get("/v1/o2plus/filecoin/save", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);
  const json = req.body;

  let getDealList = {};

  try {
    getDealList = await Lotus.getDealList();

    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        getDealList,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


// lotus client query-ask f0142606
server.get("/v1/o2plus/filecoin/queryask/:minerId", async (req, res) => {

  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  const minerId = req.params.minerId;
  try {
    const minerInfo = await Lotus.getMinerQueryAsk(minerId);
    return res.status(200).json({
      decorator: "LOWDB",
      data: {
        minerInfo,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});



// lotus client deal <cid> <miner-id> <deal-GiB> <deal-period>
server.post("/v1/o2plus/filecoin/save", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const json = req.body;
  // const dealInfo = new Serializers.DealInfo(json.cid, json.minerId, json.dealGiB, json.dealPeriod);
  const dealInfo = new Serializers.DealInfo(json.cid, json.minerId, "", json.dealPeriod);  

  try {
     const result = await Lotus.reqDeal(dealInfo);
    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        result,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


server.post("/v1/o2plus/filecoin/save/cid/:cid", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const cid = req.params.cid;
  
  try {
     const result = await Lotus.reqDealByCid(cid);
    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        result,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


//  lotus client retrieve—miner <miner-id> <cid> <path: ~/filename.ext>
server.post("/v1/o2plus/filecoin/retrieve", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const json = req.body;
  const retrieveInfo = new Serializers.RetrieveInfo(json.cid, json.minerId);

  try {
     const retData = await Lotus.getRetrieve(retrieveInfo);

    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        retData,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

//  lotus client retrieve—miner <miner-id> <cid> <path: ~/filename.ext>
server.get("/v1/o2plus/filecoin/retrieve/cid/:cid", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const cid = req.params.cid;

  try {
     const retData = await Lotus.getRetrieveByCid(cid);

    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        retData,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


server.get("/v1/o2plus/filecoin/miner", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  let minerIdList = {};

  try {
    minerIdList = await Lotus.getMinerList();

    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        minerIdList,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


server.post("/v1/o2plus/filecoin/miner", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);
  const json = req.body;

  let minerId = {};

  try {
    minerId = await Lotus.insertMiner(json);

    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        minerId,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

server.delete("/v1/o2plus/filecoin/miner/:minerId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);
  const minerId = req.params.minerId;

  let retMinerId = {}
  try {
    retMinerId = await Lotus.removeMiner(minerId);

    return res.status(200).json({
      decorator: "LOTUS",
      data: {
        data: `Remove success miner : ${retMinerId}`,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});



//  download
server.get("/dn/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const appId = req.params.appId;

  try {
    const app = await LowdbO2Plus.getApp(appId);    
    const dnFileName = app.filename; 
    //const file = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), appId, dnFileName );
    const file = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), appId, dnFileName );    

    if (fs.existsSync(file)) { 
      var filename = Utilities.getDownloadFilename(req, path.basename(file)); 
      var mimetype = mime.getType(file); 
    
      res.setHeader('Content-disposition', 'attachment; filename=' + filename); 
      res.setHeader('Content-type', mimetype); 
    
      var filestream = fs.createReadStream(file);
      filestream.pipe(res);
      ScriptLogging.log(DOWNLOAD, `file: ${filename}, UserAgent: ${req.header('User-Agent')}`);      
    } else {
      let err = {}
      err.message = `Not exist file:${filename} `; 
      err.status = '404'; 
      ScriptLogging.log(ERROR, `${err.message}`);
      res.status(err.status).send({
        err,
      });
    }

  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }

});

//////////////// lowdb
server.get("/v1/lowdb", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path}`);

  let appList = {};

  appList = await Lowdb.getAppList();

  return res.status(200).json({
    decorator: "LOWDB",
    data: {
      appList,
    },
  });
});

server.post("/v1/lowdb", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const json = req.body;
  const app = new Serializers.App(json.name, json.title, json.contents);

  try {
    const retApp = await Lowdb.insertApp(app);

    return res.status(200).json({
      decorator: "LOWDB",
      data: {
        retApp,
      },
    });
  } catch (err) {
    // console.log(err);
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

server.get("/v1/lowdb/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  const appId = req.params.appId;
  try {
    const app = await Lowdb.getApp(appId);
    return res.status(200).json({
      decorator: "LOWDB",
      data: {
        app,
      },
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});


server.put("/v1/lowdb/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${JSON.stringify(req.body)} `);

  const json = req.body;
  const app = new Serializers.App(json.name, json.title, json.contents);
  const appId = req.params.appId;

  try {
    const retApp = await Lowdb.updateApp(appId, app);

    return res.status(200).json({
      decorator: "LOWDB",
      data: retApp,
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});



server.delete("/v1/lowdb/:appId", async (req, res) => {
  req.setTimeout(0);
  ScriptLogging.log(ROUTE, `${url.parse(req.url).path} - ${req.params.appId} `);

  try {
    const appId = req.params.appId;
    const retAppId = await Lowdb.removeApp(appId);

    return res.status(200).json({
      decorator: "LOWDB",
      data: `Remove success id : ${retAppId}`,
    });
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    res.status(err.status).send({
      err,
    });
  }
});

const listenServer = server.listen(Environment.PORT, (e) => {
  if (e) throw e;

  console.log("_____     __    _     _      _____ ___    _____ ");                    
  console.log("|     |_ _|  |  |_|___| |_   |     |_  |  |   __|___ ___ _ _ ___ ___ ");
  console.log("| | | | | |  |__| |   | '_|  |  |  |  _|  |__   | -_|  _| | | -_|  _|");
  console.log("|_|_|_|_  |_____|_|_|_|_,_|  |_____|___|  |_____|___|_|  \_/|___|_|  ");
  console.log("      |___|                                                          ");
  console.log(`${Environment.CONTACT_EMAIL}`);
  ScriptLogging.log(MYLINK, `MyLink O2 Server listening on port ${Environment.PORT}`);
});

listenServer.headersTimeout = 0;
