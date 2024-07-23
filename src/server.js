'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const connectDatabase = require('./utils/db/connection');
const log = require('./services/logger').getAppLevelInstance();
const passportService = require('./services/passport');
const routeService = require('./Routes');
/********************************
 * LOAD SERVER EXPRESS SERVER
 ********************************/
class Server {
    constructor() {
        //Intializing Express Function
        this._app = express();
        this._initializeApp();
        this._server = new http.createServer(this._app);
    }

    _initializeApp() {
        this._loadCors();
        this._loadBodyParser();
        this._loadCompression();
        this._loadMongoSanitize();
        this._loadHelmet();
        this._loadDatabaseConnection();
        this._loadPassPort();
        this._loadStaticFiles();
    }
    _loadCors() {
        //setting up the cors policy
        let corsOption = { origin: '*' };
        this._app.use(cors(corsOption));
    }
    _loadBodyParser() {
        //Handling Body Parser for parsing Incoming Data request
        this._app.use(
            bodyParser.json({
                verify: function(req, res, buf) {
                    //eslint-disable-line
                    let url = req.originalUrl;
                    if (url.startsWith('/api/v1/stripe/webhook')) {
                        req.rawBody = buf.toString();
                    }
                },
            })
        );
        this._app.use(
            bodyParser.urlencoded({
                extended: true,
            })
        );
    }
    _loadCompression() {
        //compress the outgoing response
        this._app.use(compression());
    }
    _loadStaticFiles() {
        //Handling Static files with Express
        this._app.use(express.static('public'));
    }
    _loadHelmet() {
        //set HTTP response headers
        this._app.use(helmet());
    }
    _loadMongoSanitize() {
        //sanitize mongodb query
        this._app.use(mongoSanitize());
    }
    _loadDatabaseConnection() {
        //Connect to mongodb
        connectDatabase();
    }
    _loadPassPort() {
        //initialize passport and invoke passport jwt token authentication function
        passport.initialize();
        passportService();
    }
    _loadRoutes() {
        //load Route services
        routeService(this._app);
    }
    start() {
        //Start Express Server
        return Promise.resolve()
            .then(() => {
                this._loadRoutes();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    this._server.listen(5000, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                    this._server.on('error', (this._onError = this._onError.bind(this)));
                    this._server.on(
                        'listening',
                        (this._onListening = this._onListening.bind(this))
                    );
                });
            })
            .catch((error) => {
                this._onError(error);
                return Promise.reject(error);
            });
    }
    _onError(error) {
        log.error('failed to start API server with error::', error);
    }
    _onListening() {
        const addressInfo = this._server.address();
        log.info(
            `API server listening on Address: ${addressInfo.address} and port : ${addressInfo.port}`
        );
    }
}

module.exports = Server;