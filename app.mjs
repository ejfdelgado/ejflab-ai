"use strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import express from "express";
import cookieParser from 'cookie-parser';
import { PageSrv } from "@ejfdelgado/ejflab-back/srv/PageSrv.mjs";
import { cors, commonHeaders, handleErrorsDecorator, handleErrors } from "@ejfdelgado/ejflab-back/srv/Network.mjs";
import { MainHandler } from "@ejfdelgado/ejflab-back/srv/MainHandler.mjs";
import { checkAuthenticated, checkAuthenticatedSilent } from "@ejfdelgado/ejflab-back/srv/common/FirebasConfig.mjs";
import { MyFileService } from "@ejfdelgado/ejflab-back/srv/MyFileService.mjs";
import { OpenCVSrv } from "@ejfdelgado/ejflab-back/srv/OpenCVSrv.mjs";
import https from 'https'
import http from 'http'
import compression from 'compression';
import { Server } from "socket.io";
import { TupleSrv } from "@ejfdelgado/ejflab-back/srv/TupleSrv.mjs";
import { AuthorizationSrv } from "@ejfdelgado/ejflab-back/srv/AuthorizationSrv.mjs";
import { UtilesSrv } from "@ejfdelgado/ejflab-back/srv/UtilesSrv.mjs";
import { KeysSrv } from "@ejfdelgado/ejflab-back/srv/KeysSrv.mjs";
import { Usuario } from "@ejfdelgado/ejflab-back/srv/common/Usuario.mjs";
import { SecretsSrv } from "@ejfdelgado/ejflab-back/srv/SecretsSrv.mjs";

import { MyShell } from "@ejfdelgado/ejflab-back/srv/MyShell.mjs";
import { MyFileServiceLocal } from "@ejfdelgado/ejflab-back/srv/MyFileServiceLocal.mjs";
import { EmailHandler } from "@ejfdelgado/ejflab-back/srv/EmailHandler.mjs";
import { SocketIOCall } from "@ejfdelgado/ejflab-back/srv/SocketIOCall.mjs";
import bodyParser from "body-parser"
import { MongoSrv } from "@ejfdelgado/ejflab-back/srv/MongoSrv.mjs";
import { MinioSrv } from "@ejfdelgado/ejflab-back/srv/MinioSrv.mjs";
import { MilvusSrv } from "@ejfdelgado/ejflab-back/srv/MilvusSrv.mjs";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { MyConstants } from "@ejfdelgado/ejflab-common/src/MyConstants.js";
import { EjflabSrv } from "./srv/ejflab/EjflabSrv.mjs";
import { ImagiationSrv } from "./srv/ejflab/ImagiationSrv.mjs";
import { ComputeEngineSrv } from "./srv/ejflab/ComputeEngineSrv.mjs";

// Overwrite constants
MyConstants.overwriteEnvVariables();

const options = {}
let httpSrv = http;
if (process.env.USE_SECURE == "yes") {
    console.log("Using secure server...");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    options.key = fs.readFileSync(path.join(__dirname, "cert/star_xx_com.key"));
    options.cert = fs.readFileSync(path.join(__dirname, "cert/star_xx_com.pem"));
    options.minVersion = "TLSv1.3"; //Try 1.3 or 1.2
    httpSrv = https;
}

const app = express();
const httpServer = httpSrv.createServer(options, app);
//const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    },
    cors: {
        //origin: "http://localhost:4200",
        origin: "*",
        methods: ["GET", "POST", "DELETE"],
    }
});

app.use(cors);
app.use(cookieParser());
app.use(compression());
//app.use(compression({ level: 0 })); 
/*
app.use(bodyParser.urlencoded({extended: true}));
*/
//app.use(bodyParser.raw());
app.use(MainHandler.addGetUrl);
app.use('/assets', express.static('src/assets', {
    etag: false,
    maxAge: '' + (1000 * 60 * 60 * 24)
}));

// Services
//app.get('/srv/instances/start', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(ComputeEngineSrv.startInstance)]);
//app.get('/srv/instances/stop', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(ComputeEngineSrv.stopInstance)]);
app.post("/srv/email/send", [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(EmailHandler.send)]);
app.post('/srv/instances/state', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(ComputeEngineSrv.getStatus)]);
app.post('/srv/imagiation/jobs/iterate', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(ComputeEngineSrv.iterate)]);
app.post('/srv/imagiation/jobs/readall', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(ComputeEngineSrv.readAllInstances)]);
app.post('/srv/imagiation/:pageId/imagesw', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.save)]);
app.post('/srv/imagiation/:pageId/imagesr', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.read)]);
app.post('/srv/imagiation/:pageId/imagesd', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.delete)]);
app.post('/srv/imagiation/:pageId/tagsw', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.tagsSave)]);
app.post('/srv/imagiation/:pageId/tagsr', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.tagsRead)]);
app.post('/srv/imagiation/:pageId/jobr', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.jobRead)]);
app.post('/srv/imagiation/:pageId/jobsr', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.jobsRead)]);
app.post('/srv/:pageType/:pageId/jobsw', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.jobsSave)]);
app.post('/srv/imagiation/:pageId/confsp', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.confsRead)]);
app.post('/srv/imagiation/:pageId/statisticd', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.statDelete)]);
app.post('/srv/imagiation/:pageId/statistic', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(ImagiationSrv.storeStatistic)]);
//app.post('/srv/imagiation/:pageId/statisticsr', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(ImagiationSrv.pageStatistics)]);

app.post('/srv/:pageType/:pageId/confsw', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.confSave)]);
app.post('/srv/:pageType/:pageId/confsd', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.confDelete)]);
app.post('/srv/:pageType/:pageId/confsr', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_r"]]), express.json(), handleErrorsDecorator(ImagiationSrv.confRead)]);

app.post('/srv/flowchart/processor_process', [commonHeaders, bodyParser.raw({ inflate: true, limit: '500mb', type: 'application/octet-stream' }), handleErrorsDecorator(SocketIOCall.processorProcess)]);
app.post('/srv/flowchart/processor_process_json', [commonHeaders, express.json(), handleErrorsDecorator(SocketIOCall.processorProcess)]);
app.post('/srv/flowchart/processor_response', [commonHeaders, bodyParser.raw({ inflate: true, limit: '500mb', type: 'application/octet-stream' }), handleErrorsDecorator(SocketIOCall.processorResponse)]);
app.post('/srv/flowchart/load', [commonHeaders, express.json(), handleErrorsDecorator(SocketIOCall.loadFlowChart)]);
app.post('/srv/flowchart/introspect', [commonHeaders, express.json(), handleErrorsDecorator(SocketIOCall.introspect)]);

app.get('/srv/mongo/ping', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MongoSrv.ping)]);
app.post('/srv/mongo/:db/:collection/write', [commonHeaders, express.json(), handleErrorsDecorator(MongoSrv.useMongo()), handleErrorsDecorator(MongoSrv.releaseMongo(MongoSrv.write))]);
app.post('/srv/mongo/:db/read', [commonHeaders, express.json(), handleErrorsDecorator(MongoSrv.useMongo()), handleErrorsDecorator(MongoSrv.releaseMongo(MongoSrv.read))]);
app.post('/srv/mongo/:db/delete', [commonHeaders, express.json(), handleErrorsDecorator(MongoSrv.useMongo()), handleErrorsDecorator(MongoSrv.releaseMongo(MongoSrv.delete))]);
app.post('/srv/mongo/:db/update', [commonHeaders, express.json(), handleErrorsDecorator(MongoSrv.useMongo()), handleErrorsDecorator(MongoSrv.releaseMongo(MongoSrv.update))]);

app.get('/srv/minio/ping', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MinioSrv.ping)]);
app.get('/srv/minio/:bucket/*', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MinioSrv.readFile)]);
app.post('/srv/minio/:bucket/write', [commonHeaders, bodyParser.raw({ inflate: true, limit: '500mb', type: 'application/octet-stream' }), handleErrorsDecorator(MinioSrv.writeFile)]);

app.get('/srv/milvus/ping', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MilvusSrv.ping)]);
app.post('/srv/milvus/insert', [commonHeaders, bodyParser.raw({ inflate: true, limit: '500mb', type: 'application/octet-stream' }), handleErrorsDecorator(MilvusSrv.insert)]);
app.post('/srv/milvus/search', [commonHeaders, bodyParser.raw({ inflate: true, limit: '500mb', type: 'application/octet-stream' }), handleErrorsDecorator(MilvusSrv.search)]);
app.post('/srv/milvus/admin', [commonHeaders, express.json(), handleErrorsDecorator(MilvusSrv.admin)]);

app.get('/srv/postgres/ping', [commonHeaders, handleErrorsDecorator(PostgresSrv.test)]);

app.get('/srv/shell', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyShell.run)]);

app.post('/srv/sec/r', [commonHeaders, checkAuthenticated, express.json(), handleErrorsDecorator(SecretsSrv.read)]);
app.post('/srv/sec/w', [commonHeaders, checkAuthenticated, express.json(), handleErrorsDecorator(SecretsSrv.save)]);
app.post('/srv/sec/pub', [commonHeaders, checkAuthenticated, express.json(), handleErrorsDecorator(SecretsSrv.getPubKey)]);

app.get('/srv/usr/me', [commonHeaders, checkAuthenticated, handleErrorsDecorator(Usuario.getCurrentUser)]);
app.post('/srv/usr/me', [commonHeaders, checkAuthenticated, express.json(), handleErrorsDecorator(MyFileService.uploadFile), handleErrorsDecorator(Usuario.saveMyUser)]);
app.get('/srv/date', [commonHeaders, handleErrorsDecorator(UtilesSrv.fecha)]);
app.get('/srv/pg/:pageType/:idUser/:pageId/*', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_r"]]), handleErrorsDecorator(MyFileService.readFile)]);
app.delete('/srv/pg/:pageType/:idUser/:pageId/*', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_w"]]), handleErrorsDecorator(MyFileService.deleteFile)]);
app.get('/srv/pg', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(PageSrv.getCurrentPage)]);
app.post('/srv/pg/new', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(PageSrv.createNewPage)]);
app.get('/srv/pg/mines', [commonHeaders, checkAuthenticated, express.json(), handleErrorsDecorator(PageSrv.iterateMyPages)]);
app.get('/srv/pg/all', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(PageSrv.iterateAllPages)]);
app.get('/srv/:pageId/keys', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["tup_r"]]), handleErrorsDecorator(KeysSrv.getPageKeys)]);
app.post('/srv/:pageId/pg', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(MyFileService.uploadFile), handleErrorsDecorator(PageSrv.savePage)]);
app.delete('/srv/:pageId/pg', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(PageSrv.deletePage)]);
app.post('/srv/:pageId/rotate1', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(PageSrv.rotateSecret1)]);
app.post('/srv/:pageId/rotate2', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(PageSrv.rotateSecret2)]);
app.post('/srv/:pageId/rotate3', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["pg_w"]]), express.json(), handleErrorsDecorator(PageSrv.rotateSecret3)]);
app.get('/srv/:pageId/tup', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["tup_r"]]), handleErrorsDecorator(TupleSrv.read)]);
app.post('/srv/:pageId/tup', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["tup_w"]]), express.json(), handleErrorsDecorator(TupleSrv.save)]);
app.delete('/srv/:pageId/tup', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["tup_w"]]), express.json(), handleErrorsDecorator(TupleSrv.deleteAll)]);
app.get('/srv/:pageId/auth', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["per_r"]]), handleErrorsDecorator(AuthorizationSrv.readAll)]);
app.post('/srv/:pageId/auth', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["per_w"]]), express.json(), handleErrorsDecorator(AuthorizationSrv.save)]);
app.post('/srv/:pageId/file', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_w"]]), express.json(), handleErrorsDecorator(MyFileService.uploadFile), MyFileService.uploadFileResponse]);
app.post('/srv/:pageId/makefilepub', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_w"]]), express.json(), handleErrorsDecorator(MyFileService.setFilePublicSrv)]);
app.post('/srv/:pageId/makegif', [commonHeaders, checkAuthenticatedSilent, AuthorizationSrv.hasPagePermisions([["fil_w"]]), express.json(), handleErrorsDecorator(MyFileService.uploadFile), handleErrorsDecorator(MyFileService.makegif)]);

app.post('/srv/local/ls', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(MyFileServiceLocal.listFiles)]);

app.post('/srv/:pageType/:pageId/localfile', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(MyFileServiceLocal.uploadFile)]);
app.delete('/srv/:pageType/:pageId/localfile/*', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyFileServiceLocal.deleteFile)]);
app.get('/srv/:pageType/:pageId/localfile/*', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyFileServiceLocal.readFile)]);

app.post('/srv/:pageType/:pageId/localtuple.json', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(MyFileServiceLocal.uploadFile)]);
app.delete('/srv/:pageType/:pageId/localtuple.json', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyFileServiceLocal.deleteFile)]);
app.get('/srv/:pageType/:pageId/localtuple.json', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyFileServiceLocal.readFile)]);

app.post('/srv/:pageType/:pageId/localpage.json', [commonHeaders, checkAuthenticatedSilent, express.json(), handleErrorsDecorator(MyFileServiceLocal.uploadFile)]);
app.delete('/srv/:pageType/:pageId/localpage.json', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyFileServiceLocal.deleteFile)]);
app.get('/srv/:pageType/:pageId/localpage.json', [commonHeaders, checkAuthenticatedSilent, handleErrorsDecorator(MyFileServiceLocal.readFile)]);

app.post('/srv/opencv/solvepnp', [commonHeaders, express.json({ limit: '50mb' }), handleErrorsDecorator(OpenCVSrv.solvePnP)]);

// Configure wideSight api
EjflabSrv.configure(app);

app.use("/", handleErrorsDecorator(MainHandler.handle));// Esto solo funciona sin el npm run angular

io.on('connection', SocketIOCall.handle(io));

// fuser 8081/tcp
// fuser -k 8081/tcp
const PORT = process.env.PORT || 8081;
httpServer.listen(PORT, () => {
    console.log(
        `App listening on http://localhost:${PORT} Press Ctrl+C to quit.`
    );
});

export default app;
