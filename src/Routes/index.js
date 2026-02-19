'use strict';
/******************************************************************
 * EXPRESS ROUTING TO REDIRECT USER REQUEST TO THE GIVEN CONTROLLER
********************************************************************/
const adminRoutes = require('./Admin/admin.routes');
const userRoutes = require('./User'); // 确保这里指向的是文件夹或 index.js
const responseHelper = require('../services/customResponse');
const exp = require('express');
const path = require('path');

// 1. 引入 Controller (为了拿解码函数)
const userVehicleController = require('../controller/userController/vehicle');

module.exports = (app) => {
    app.set("view engine", "ejs");
    app.use(exp.static(path.join(__dirname, '../../public')));
    
    // 跨域设置
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,PATCH,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,token');
        next();
    });

    // 🔥🔥🔥🔥🔥 核心修复：双重拦截 (Double Catch) 🔥🔥🔥🔥🔥
    
    // 情况 A: 前端请求不带 v1 (你现在的报错就是这个)
    app.get('/api/user/vehicle/decode/:vin', (req, res, next) => {
        console.log("⚡️ [No-v1] 拦截到 VIN 解码请求，正在执行...");
        next();
    }, userVehicleController.getVehicleDetailsByVin);

    // 情况 B: 前端请求带 v1 (标准的写法)
    app.get('/api/v1/user/vehicle/decode/:vin', (req, res, next) => {
        console.log("⚡️ [With-v1] 拦截到 VIN 解码请求，正在执行...");
        next();
    }, userVehicleController.getVehicleDetailsByVin);

    // 🔥🔥🔥🔥🔥 修复结束 🔥🔥🔥🔥🔥


    /**
    * Handling Admin and User Routes
    */
    app.use('/api/admin', adminRoutes(app));
    app.use('/api/v1/user', userRoutes(app));

    /**
     * Handling Static Files
     */
    app.get('/panel/*', exp.static(path.join(__dirname, '../../public', 'panel'), { maxAge: '1y' }));
    app.all('/panel/*', function (req, res) {
        res.status(200).sendFile(path.join(__dirname, '../../public', 'panel', 'index.html'));
    });

    app.get('/fetcht/', exp.static(path.join(__dirname, '../../public', 'fetch'), { maxAge: '1y' }));
    app.all('/fetcht/*', function (req, res) {
        res.status(200).sendFile(path.join(__dirname, '../../public', 'fetcht', 'index.html'));
    });

    /**
     * Health Check Route
     */
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK' });
    });

    /**
     * ⚠️ 兜底路由 (Catch-All)
     * 之前你的请求就是掉进这里了，所以才报 403！
     */
    app.get('*', (req, res) => {
        let responseData = {};
        responseData.msg = 'UnAuthorized Access (Route Not Found)';
        return responseHelper.error(res, responseData);
    });
};