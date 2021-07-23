"use strict";

import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as Exception from "~/common/exception";
import * as LowdbO2Plus from "~/node_common/lowdb-o2plus";

import Busboy from "busboy";
import path from "path";
import fs from "fs";
import fse from "fs-extra";

const UPLOAD = "UPLOAD          ";
const REMOVE = "REMOVE          ";
const ERROR  = "ERROR           ";
const LOTUS  = "LOTUS           ";


export let indexJson = {}; 
export let generateUrl = ''; 

let appHpmePath = "";  

export const uploadFile = async (req, res, userAppId) => {

    appHpmePath = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId );    
    let lowDBApp = LowdbO2Plus.getApp(userAppId); 

    const uploadSizeBytes = req.headers["content-length"];
    if (uploadSizeBytes > Environment.UPLOAD_FILE_LIMIT_SIZE) {
          
      const err = Exception.badRequestException(`File Size Too Large : ${uploadSizeBytes} > Limit : ${Environment.UPLOAD_FILE_LIMIT_SIZE}` ); 
      ScriptLogging.error(UPLOAD, err.message);
  
      res.set("Connection", "close");
      return res.status(err.status).send({
        err,
      });
    } 
    const busboy = new Busboy({
      headers: req.headers,
      limits: {
        fileSize: Environment.UPLOAD_FILE_LIMIT_SIZE
      }
  
    });
  
    let uploadFileName = '';
    try {
      
      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
  
        ScriptLogging.log(UPLOAD, `upload info > fieldname : ${fieldname} filename : ${filename} encoding : ${encoding} mimetype : ${mimetype} uploadSizeBytes : ${uploadSizeBytes}`);

          uploadFileName = filename;
  
          const uploadFile = path.join( appHpmePath , filename);
          ScriptLogging.log(UPLOAD, `Uploading start ${uploadFile}`);
          file.pipe(fs.createWriteStream(uploadFile));
  
          file.on('limit', function () {
            const err = Exception.badRequestException(`Size limit reached for ${fieldname}->${filename}, over ${Environment.UPLOAD_FILE_LIMIT_SIZE} Byte`); 
            ScriptLogging.error(UPLOAD, err.message);
  
            fs.unlink(uploadFile, function () {
              ScriptLogging.log(UPLOAD, `remove file :  ${uploadFile} `);
            });
            
            return res.status(err.status).send({
              err,
            });
          });
  
  
          // success file upload
          busboy.on('finish', function () {
            ScriptLogging.log(UPLOAD, `Upload complete  ${uploadFile}`);
            var cid = ""; 
            var getCidCB = function(callback) { 

              let exec = require('child_process').exec
              const cmd = `lotus client import '${Environment.UPLOAD_BASE_FILE_PATH}/${userAppId}/${filename}'`;              
              ScriptLogging.log(LOTUS, `${cmd}`);              
              exec(cmd, (err,out,stderr) => { 
                ScriptLogging.log(LOTUS, `${out}`);              
                cid = out.split(' ').pop().replace('\n', ''); 
                callback(cid); 
              });
            }  
            getCidCB(function(resCid) {
              cid = resCid; 
              generateUrl = `${Environment.HOST_DOWNLOAD_ROOT}${userAppId}`; 
              lowDBApp.url = generateUrl; 
              lowDBApp.cid = cid; 
              lowDBApp.filename = filename; 
              LowdbO2Plus.updateApp(userAppId, lowDBApp); 
  
              return res.status(200).json({
              code: `200`,
              appId : userAppId, 
              url: generateUrl,
              cid : cid
              });

            }); 
          });
      });
  
    } catch (e) {
      ScriptLogging.error(ERROR, e.message);
    }
  
    req.pipe(busboy);
  
    return uploadFileName;    
}
  
  export const removeApp = async (userAppId) => {

      appHpmePath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId );
      if (!fs.existsSync( appHpmePath )) {
        const errException = Exception.notExistException(appHpmePath);     
        ScriptLogging.error (ERROR, errException.message);        
        return;  
      } else  { 
                     
        fse.remove(appHpmePath)
          .then(() => {
            ScriptLogging.log (REMOVE, appHpmePath);
        })
          .catch(err => {
            ScriptLogging.error(ERROR, err.message);
        })    
    } 

  };

