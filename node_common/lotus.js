"use strict";

import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as Strings from "~/common/strings";
import * as Exception from "~/common/exception";
import * as LowdbO2Plus from "~/node_common/lowdb-o2plus";
import path from "path";
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";


const LOTUS = "LOTUS           ";
const LOWDB = "LOWDB           ";
const ERROR = "ERROR           ";

const lowDbFile = path.join(process.cwd(), path.normalize(Environment.LOWDB_O2PLUS_LOTUS_PATH));
const adapter = new FileSync(lowDbFile);
const db = low(adapter);
let obj = { miner: [] };
db.defaults(obj).write();



export const getDealList = async () => {

  const cmd = `lotus client list-deals`;
  ScriptLogging.log(LOTUS, `${cmd}`);    

  const { stdout, stderr } = await exec(cmd);
  if (stderr) {
    ScriptLogging.log(ERROR, `${stderr}`);    
  }
  ScriptLogging.log(LOTUS, `${stdout}`);      
  return stdout;
};


// lotus client deal <cid> <miner-id> <deal-GiB> <deal-period>
// json.cid, json.minerId, json.dealGiB, json.dealPeriod
export const reqDeal = async (dealInfo) => {


  if(Strings.isEmpty(dealInfo.cid)) { 
    throw Exception.badRequestException("cid is not input"); 
  }
  if(Strings.isEmpty(dealInfo.minerId)) { 
    throw Exception.badRequestException("minerId is not input"); 
  }

  let dealPeriod = Environment.LOTUS_DEAL_PERIOD; 
  if( Strings.isEmpty(dealInfo.dealPeriod)) { 
    dealPeriod = Environment.LOTUS_DEAL_PERIOD; 
  } else {
    dealPeriod = dealInfo.dealPeriod; 
  }

  const cmd = `./node_common/expect-deal.sh ${dealInfo.cid} ${dealPeriod} ${dealInfo.minerId} ` ;  
  ScriptLogging.log(LOTUS, `${cmd}`);    

  let result = {}; 
  const { stdout, stderr } = await exec(cmd);
  if (stderr) {
    ScriptLogging.log(ERROR, `${stderr}`);    
    throw Exception.internalException(stderr);     
  }
  const dealCid  = stdout.split(' ').pop().replace('\n', '').replace('\r', '').replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

    if(dealCid === 'yes') { 
      throw Exception.internalException("Occurred error deal cid"); 
    }


    let userApp = {}; 
    try {
      userApp = await LowdbO2Plus.getAppByCid(dealInfo.cid);

      userApp.cid = dealInfo.cid; 
      userApp.dealCid = dealCid;     
      userApp.minerId = dealInfo.minerId;       
      userApp.dealPeriod = dealPeriod;     

      await LowdbO2Plus.updateApp(userApp.appId, userApp);     

    } catch (err) {
      ScriptLogging.log(ERROR, `${err}`);
    }

    result.cid = dealInfo.cid; 
    result.dealCid = dealCid;     
    result.minerId = dealInfo.minerId;     
    result.dealPeriod = dealPeriod; 

  ScriptLogging.log(LOTUS, `${JSON.stringify(result)}`);        
  return result;

};


// lotus client deal <cid> <miner-id> <deal-GiB> <deal-period>
// json.cid, json.minerId, json.dealGiB, json.dealPeriod
export const reqDealByCid = async (cid) => {

  if(Strings.isEmpty(cid)) { 
    throw Exception.badRequestException("cid is not input"); 
  }

  const getMinerList = db.get("miner").value(); 
  if(getMinerList.length === 0) { 
    throw Exception.notExistException("MinerID"); 
  }  
  const minerId = getMinerList[0].minerId; 
//   const dealGiB = "0.0000000005";   
  // const dealPeriod = "180"; 
  const dealPeriod = Environment.LOTUS_DEAL_PERIOD; 

  // const cmd = `lotus client deal ${cid} ${minerId} ${dealGiB} ${dealPeriod}` ;
  const cmd = `./node_common/expect-deal.sh ${cid} ${dealPeriod} ${minerId} ` ;  
  ScriptLogging.log(LOTUS, `${cmd}`);    

  let result = {}; 
   const { stdout, stderr } = await exec(cmd);
   if (stderr) {
     ScriptLogging.log(ERROR, `${stderr}`);    
     throw Exception.internalException(stderr); 
   }

   ScriptLogging.log(LOTUS, `${stdout}`);    
   const dealCid  = stdout.split(' ').pop().replace('\n', '').replace('\r', '').replace(
     /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

     if(dealCid === 'yes') { 
      throw Exception.internalException("Occurred error deal cid"); 
    }


     result.cid = cid; 
     result.dealCid = dealCid;     
     result.minerId = minerId;     
     result.dealPeriod = dealPeriod;     

    let userApp = {}; 
    try {
      userApp = await LowdbO2Plus.getAppByCid(cid);

      userApp.cid = cid; 
      userApp.dealCid = dealCid;     
      userApp.minerId = minerId;     
      userApp.dealPeriod = dealPeriod;     

      await LowdbO2Plus.updateApp(userApp.appId, userApp);     

    } catch (err) {
      ScriptLogging.log(ERROR, `${err}`);
    }
    

  ScriptLogging.log(LOTUS, `${JSON.stringify(result)}`);      
  return result;
};


//  lotus client retrieve—miner <miner-id> <cid> <path: ~/filename.ext>
// lotus client retrieve --miner f0215497 bafykbzacecheq2jdugey6sdjj2vsdd5j4cwpgpxgh7hpdcrfridhrnakdux44 ~/retrieve.mp4
export const getRetrieve = async (retrieveInfo) => {

  if(Strings.isEmpty(retrieveInfo.cid)) { 
    throw Exception.badRequestException("cid is not input"); 
  }
  if(Strings.isEmpty(retrieveInfo.minerId)) { 
    throw Exception.badRequestException("minerId is not input"); 
  }

  const minerId = retrieveInfo.minerId; 
  const cid = retrieveInfo.cid; 


  let app = {}; 
  try {
    app = await LowdbO2Plus.getAppByCid(cid);
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    throw Exception.internalException("cid");     
  }

  const filename = app.filename; 
  const appId = app.appId; 

  //const appFileFullPath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), appId, filename );  
  const appFileFullPath = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), appId, filename );  
  const downloadUrl = `${Environment.HOST_ROOT}${appId}`; 

  const cmd = `lotus client retrieve --miner ${minerId} --allow-local ${cid} '${appFileFullPath}'`;
  // const cmd = `lotus client retrieve --allow-local ${cid} '${appFileFullPath}'`;

  ScriptLogging.log(LOTUS, `${cmd}`);    

  // const retrieveInfo = {}; 

  retrieveInfo.cid = cid; 
  retrieveInfo.minerId = minerId; 
  retrieveInfo.filename = filename;   
  retrieveInfo.downloadUrl = downloadUrl; 
  
   // await init(20); 
   return retrieveInfo; 

};




//  lotus client retrieve—miner <miner-id> <cid> <path: ~/filename.ext>
// lotus client retrieve --miner f0215497 bafykbzacecheq2jdugey6sdjj2vsdd5j4cwpgpxgh7hpdcrfridhrnakdux44 ~/retrieve.mp4
export const getRetrieveByCid = async (cid) => {

  if(Strings.isEmpty(cid)) { 
    throw Exception.badRequestException("cid is not input"); 
  }
  
  const getMinerList = db.get("miner").value(); 
  if(getMinerList.length === 0) { 
    throw Exception.notExistException("MinerID"); 
  }  
  const minerId = getMinerList[0].minerId; 


  let app = {}; 
  try {
    app = await LowdbO2Plus.getAppByCid(cid);
  } catch (err) {
    ScriptLogging.log(ERROR, `${err}`);
    throw Exception.internalException("cid");     
  }

  const filename = app.filename; 
  const appId = app.appId; 

  //const appFileFullPath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), appId, filename );  
  const appFileFullPath = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), appId, filename );    

  const downloadUrl = `${Environment.HOST_ROOT}${appId}`; 

  const cmd = `lotus client retrieve --miner ${minerId} --allow-local ${cid} '${appFileFullPath}'`;
  // const cmd = `lotus client retrieve --allow-local ${cid} '${appFileFullPath}'`;
  ScriptLogging.log(LOTUS, `${cmd}`);    

  const retrieveInfo = {}; 

  retrieveInfo.cid = cid; 
  retrieveInfo.minerId = minerId; 
  retrieveInfo.filename = filename;   
  retrieveInfo.downloadUrl = downloadUrl; 
  
  // await init(20); 
  // return retrieveInfo; 

  const { stdout, stderr } = await exec(cmd);
  if (stderr) {
    ScriptLogging.log(ERROR, `${stderr}`);    
  }
  ScriptLogging.log(LOTUS, `${stdout}`);      
  return stdout;
};




// lotus client query-ask f0142606
export const getMinerQueryAsk = async (minerId) => {

  const cmd = `lotus client query-ask ${minerId}`;
  ScriptLogging.log(LOTUS, `${cmd}`);    

  const { stdout, stderr } = await exec(cmd);
  if (stderr) {
    ScriptLogging.log(ERROR, `${stderr}`);    
  }
  ScriptLogging.log(LOTUS, `${stdout}`);      
/*
  TODO 파싱할 데이터 샘플
  ------------------------
  Ask: f0142606
  Price per GiB: 0.0000000001 FIL
  Verified Price per GiB: 0.00000000005 FIL
  Max Piece size: 32 GiB
  Min Piece size: 1 GiB
*/  

  return stdout;

};


export const getMinerList = async () => {
  const getMinerList = db.get("miner").value(); 
  if(getMinerList.length === 0) { 
    throw Exception.notExistException("MinerID"); 
  }

 ScriptLogging.log(LOWDB, `miner List  ${JSON.stringify(getMinerList)}`);
 return getMinerList;  

};



export const insertMiner = async (miner) => {
  
  const minerId = miner.minerId;  
  const getMinerSize = db.get("miner").find({ minerId: minerId }).size().value(); 

  if(getMinerSize > 0) { 
    throw Exception.alreadyExistException(minerId); 
  }
  
  const insertMiner = {
   minerId: miner.minerId, 
   date: Strings.nowDateTime(),
 };
 db.get("miner").push(insertMiner).write();

 ScriptLogging.log(LOWDB, `insert ${JSON.stringify(insertMiner)}`);
 return insertMiner;

};


export const removeMiner = async (minerId) => {

  const getMinerSize = db.get("miner").find({ minerId: minerId }).size().value(); 
  if(getMinerSize === 0) { 
    throw Exception.notExistException(minerId); 
  }

 db.get("miner").remove({ minerId: minerId }).write();

 ScriptLogging.log(LOWDB, `remove ${JSON.stringify(minerId)}`);
 return minerId;

};






export const init = async (val) => {
  for (let i=0; i<val; i++){
      await sleep(1000);
      console.log(i);
  }
}
const sleep = (ms) => {
   return new Promise(resolve=>{
       setTimeout(resolve,ms)
   })
}

