"use strict";

import * as Environment from "~/node_common/environment";
import * as ScriptLogging from "~/node_common/script-logging";
import * as Lowdb from "~/node_common/lowdb";
import * as Serializers from "~/node_common/serializers";
import * as Strings from "~/common/strings";
import * as Exception from "~/common/exception";

import url from "url";
import Busboy from "busboy";
import path from "path";
import fs from "fs";
import fse from "fs-extra";
import mkdirp from "mkdirp";
import ExtractZip from "extract-zip";
import request from "request"; 
import { captureRejectionSymbol } from "events";

const UPLOAD = "UPLOAD          ";
const REMOVE = "REMOVE          ";
const ERROR  = "ERROR           ";


export let indexJson = {}; 
export let generateUrl = ''; 

let appHpmePath = "";  

// 사용자 AppId 
// let userAppId; 

export const uploadZipFile = async (req, res, userAppId) => {

  //appHpmePath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId );
  appHpmePath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId );  

  const uploadSizeBytes = req.headers["content-length"];
  if (uploadSizeBytes > Environment.UPLOAD_FILE_LIMIT_SIZE) {
        
    const err = Exception.badRequestException(`File Size Too Large : ${uploadSizeBytes} > Limit : ${Environment.UPLOAD_FILE_LIMIT_SIZE}` ); 
    ScriptLogging.error(UPLOAD, err.message);

    res.set("Connection", "close");
    return res.status(err.status).send({
      err,
    });
  } 

  if (!fs.existsSync( appHpmePath )) {
    await mkdirp( appHpmePath )
      .then(made =>
        ScriptLogging.log(UPLOAD, `made directoriy : ${made}`));
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
      

      // mimeType = ['application/x-zip-compressed', 'application/zip'];   
      if (!mimetype.includes('zip')) {

        const err = Exception.badRequestException(`It's not zip format file : ${filename}`); 
        ScriptLogging.error(UPLOAD, err.message);
        res.set("Connection", "close");
        return res.status(err.status).send({
          err,
        });

      } else {  

        uploadFileName = filename;

        const uploadFile = path.join( appHpmePath , filename);
        ScriptLogging.log(UPLOAD, `Uploading start ${uploadFile}`);
        file.pipe(fs.createWriteStream(uploadFile));

        // TODO file size가 클 경우 완료 로직 발생 상황 수정 필요 
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


        // zip 압축파일 업로드 완료 
        busboy.on('finish', function () {
          ScriptLogging.log(UPLOAD, `Upload complete  ${uploadFile}`);

          // 업로드 완료 후 처리 동작 
          try {  
            fileBackendProcess(uploadFile, userAppId, function(err) {

              if(err) { 
                ScriptLogging.log(ERROR, `${err}`);
                res.status(err.status).send({
                  err,
                });
              } else {  

                generateUrl = `${Environment.HOST_ROOT}${userAppId}`; 
                return res.status(200).json({
                  code: `200`,
                  appId : userAppId, 
                  url: generateUrl
                });
              } 
            });
          } catch(err) { 
            ScriptLogging.log(ERROR, `${err}`);
            res.status(err.status).send({
              err,
            });
          } 
        });
    }

    });

  } catch (e) {
    ScriptLogging.error(ERROR, e.message);
  }

  req.pipe(busboy);

  return uploadFileName;

} 


const fileBackendProcess = async (uploadFile, userAppId, callback) => {

    try {
      // zip 압축파일 해제
      await ExtractZip(uploadFile, { dir: appHpmePath  })
      ScriptLogging.log(UPLOAD, `Extract zip file ${uploadFile}`);

    } catch (err) {
      ScriptLogging.error(ERROR, err.message);
      const errException = Exception.internalException("Error occured Extract zip file : " + err);    
      callback(errException);       
//      throw Exception.internalException("Error occured Extract zip file : " + err);    
    } finally { 

      try { 
        await fs.unlinkSync( uploadFile );
        ScriptLogging.log(UPLOAD, `remove zip file ${uploadFile}`);        
      } catch(err) { 
        ScriptLogging.error(ERROR, err.message);
      }  

    }
  
    /// 압축파일에 포함된 index.js 파일 파싱, 파일 존재 여부 체크 
    try { 
      await generateIndex(userAppId);
    } catch(err) { 
      callback(err); 
    } 
    callback(null); 
  
  };
  
  
  
  /**
   * index.json 파일로 실제 index.html 파일 생성 
   */
  const generateIndex = (userAppId) => {
  
    const indexJsonFile = path.join(appHpmePath, "index.json");
    console.log(indexJsonFile);
  
    if (!fs.existsSync(indexJsonFile)) {
      const errException = Exception.notExistException(`Not exist source index file : ${indexJsonFile}`); 
      ScriptLogging.error(ERROR, errException.message);
      throw errException; 
    }
  
    const indexFileData = fs.readFileSync(indexJsonFile, 'utf8');
    //  console.log('-----------------');
    //  console.log(indexFileData);
    //  console.log('-----------------');
  
    try {
      indexJson = JSON.parse(indexFileData);

      const url = Environment.GENERATE_URL; 
      // const savePath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId, "index.html"); 
      const savePath = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId, "index.html");       

      request(url, function (err, response, html) {
        if (err) {
          ScriptLogging.error(ERROR, err);
        } else {
          fs.writeFileSync(savePath, html, { mode: 0o755 });
          ScriptLogging.log(UPLOAD, `generate index.html`);
        }
      });

    } catch (err) {
      const errException = Exception.internalException(err);     
      ScriptLogging.error(ERROR, errException.message);
      throw errException; 
    }
  
  }
  
  
  export const removeApp = async (userAppId) => {

      // appHpmePath = path.join( process.cwd(), path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId );
      appHpmePath = path.join( path.normalize(Environment.UPLOAD_BASE_FILE_PATH), userAppId );      
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

