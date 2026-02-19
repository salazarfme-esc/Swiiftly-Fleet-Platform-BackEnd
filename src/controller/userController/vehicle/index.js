'use strict';
// ✅ 1. 确保引入了 decodeVin
const { decodeVin } = require('../../../services/vinService');
const logger = require('../../../services/logger');
const mongoose = require('mongoose');
const log = new logger('UserVehicleController').getChildLogger();
const dbService = require('../../../services/db/services');
const responseHelper = require('../../../services/customResponse');
const userDbHandler = dbService.User;
const VehicleDbHandler = dbService.Vehicle;
const ServiceCategoryDbHandler = dbService.ServiceCategory;
const VehicleAggregate = require("../../../services/db/models/vehicles");
const makeDbHandler = dbService.Make;
const modelDbHandler = dbService.Model;
const MainJobDbHandler = dbService.MainJob;
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const path = require('path');
const config = require('../../../config/environments');
const AWS = require('aws-sdk');
const moment = require('moment');
const axios = require('axios');

/*******************
 * PRIVATE FUNCTIONS
 ********************/

AWS.config.update({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region // Optional: Specify your AWS region if different from default
});
const s3 = new AWS.S3();

const downloadFile = async (bucketName, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const params = { Bucket: bucketName, Key: filePath };

            const downloadStream = s3.getObject(params).createReadStream();
            // 确保目录存在
            if (!fs.existsSync('./excel')) {
                fs.mkdirSync('./excel');
            }
            const writeStream = fs.createWriteStream(`./excel/${filePath}`);

            downloadStream.pipe(writeStream)
                .on('error', (err) => {
                    console.error('Error downloading file:', err);
                    reject(err); 
                })
                .on('finish', () => {
                    console.log('File downloaded successfully!');
                    resolve(); 
                });
        } catch (err) {
            console.error('Error:', err);
            reject(err); 
        }
    });
};

/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/

module.exports = {
    /**
     * Method to add Vehicle
     */
    AddVehicle: async (req, res) => {
        let reqObj = req.body;
        let user = req.user;
        let id = user.sub;
        log.info('Received request for add vehicle:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let checkVehicle = await VehicleDbHandler.getByQuery({ identification_number: reqObj.identification_number });
            let checkVehicle1 = await VehicleDbHandler.getByQuery({ license_plate: reqObj.license_plate });

            if (checkVehicle.length) {
                responseData.msg = 'Vehicle with this identification number already exists!';
                return responseHelper.error(res, responseData);
            }
            if (checkVehicle1.length) {
                responseData.msg = 'Vehicle with this license plate already exists!';
                return responseHelper.error(res, responseData);
            }

            // Check if the make exists, if not create it
            let make = await makeDbHandler.getByQuery({ title: reqObj.make });
            let makeId;

            if (make.length) {
                makeId = make[0]._id; 
            } else {
                let newMake = await makeDbHandler.create({ title: reqObj.make });
                makeId = newMake._id; 
            }

            // Check if the model exists for the given make, if not create it
            let model = await modelDbHandler.getByQuery({ title: reqObj.model, make_id: makeId });
            let modelId;

            if (model.length) {
                modelId = model[0]._id; 
            } else {
                let newModel = await modelDbHandler.create({ title: reqObj.model, make_id: makeId });
                modelId = newModel._id; 
            }

            let media = [];
            let document = [];

            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }
            if (req.files && req.files.document) {
                for (let i = 0; i < req.files.document.length; i++) {
                    document.push(req.files.document[i].location);
                }
            }

            let submitData = {
                identification_number: reqObj.identification_number || '',
                nickname: reqObj.nickname || '',
                year: reqObj.year || '',
                make: makeId, 
                model: modelId, 
                color: reqObj.color || '',
                registration_due_date: reqObj.registration_due_date || '',
                issue_date: reqObj.issue_date || "",
                registration_place: reqObj.registration_place || "",
                in_fleet: reqObj.in_fleet || "",
                gas_electric: reqObj.gas_electric || '',
                license_plate: reqObj.license_plate || '',
                address: {
                    street: reqObj.street || '',
                    address: reqObj.address || '',
                    city: reqObj.city || '',
                    district: reqObj.district || '',
                    state: reqObj.state || '',
                    pin: reqObj.pin || '',
                    country: reqObj.country || '',
                },
                location: {
                    type: 'Point',
                    coordinates: reqObj.coordinates || [0.0000, 0.0000],
                },
                media: media || [],
                document: document || [],
                user_id: id,
                last_oil_change: reqObj.last_oil_change || ''
            }

            let saveData = await VehicleDbHandler.create(submitData);
            responseData.msg = 'Data saved!';
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to save data with error::', error);
            responseData.msg = 'Failed to save data!';
            return responseHelper.error(res, responseData);
        }
    },

    // 🚀 这里是我们更新过的 SMART Bulk Upload
    BulkUploadVehicles: async (req, res) => {
        let responseData = {};
        let response = {
            successCount: 0,
            failureCount: 0,
            failedRecords: []
        };
        let user = req.user;
        let id = user.sub;
        log.info('Received SMART bulk upload request.');

        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }
            if (!req.file) {
                responseData.msg = 'Please upload a file!';
                return responseHelper.error(res, responseData);
            }
            const filePath = req.file.key; 
            const bucketName = config.aws.s3Bucket;

            // Download the file from S3
            await downloadFile(bucketName, filePath);

            // Convert Excel to JSON
            const excelData = excelToJson({
                sourceFile: `./excel/${filePath}`,
                header: { rows: 1 },
                columnToKey: {
                    A: 'identification_number',
                    B: 'nickname',
                    C: 'license_plate',
                    D: 'year',
                    E: 'make',
                    F: 'model',
                    G: 'color',
                    H: 'gas_electric',
                    I: 'issue_date',
                    J: 'registration_place',
                    K: 'registration_due_date',
                    L: 'last_oil_change',
                    M: 'in_fleet',
                    N: 'street',
                    O: 'address',
                    P: 'city',
                    Q: 'district',
                    R: 'state',
                    S: 'pin',
                    T: 'country',
                    U: 'coordinates',
                    V: 'media',
                    W: 'document',
                }
            });

           // Loop through each record
            const sheetName = Object.keys(excelData)[0];
            const records = excelData[sheetName] || [];

            // 👇👇👇 这里的逻辑是：智能解码 + 自动修复 + 格式转换 (ID Lookup) 👇👇👇
            for (let record of records) { 
                try {
                    const vin = record.identification_number;

                    // 1. 必填项检查
                    if (!vin) {
                        response.failureCount++;
                        response.failedRecords.push({ record, reason: 'Missing VIN' });
                        continue;
                    }

                    // 2. 查重 (Check Duplicate)
                    let checkVehicle = await VehicleDbHandler.getByQuery({ identification_number: vin }); // ✅ 改成了大写 V
                    if (checkVehicle.length) {
                        response.failureCount++;
                        response.failedRecords.push({ record, reason: 'VIN already exists!' });
                        continue;
                    }

                    // ==========================================
                    // 🚀 核心升级：VIN 智能解码 (Smart Decode)
                    // ==========================================
                    let decodedData = {};
                    try {
                        // 调用 API
                        const apiRes = await axios.get(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
                        const results = apiRes.data.Results;
                        const getVal = (id) => results.find(r => r.VariableId === id)?.Value;
                        
                        decodedData = {
                            year: getVal(29),
                            make: getVal(26),
                            model: getVal(28),
                            fuel: getVal(9),
                            body_class: getVal(5)
                        };
                        console.log(`✅ Smart Decoded: ${vin} -> ${decodedData.make} ${decodedData.model}`);
                    } catch (vinErr) {
                        console.log("⚠️ API Decode failed, using Excel data.");
                    }

                    // ==========================================
                    // 🛠️ 关键修复：数据清洗 (Data Cleaning)
                    // ==========================================

                    // A. 修复燃油类型 (Gasoline -> gas)
                    let rawFuel = decodedData.fuel || record.gas_electric || 'gas';
                    let fixedFuel = 'gas';
                    if (rawFuel && (rawFuel.toLowerCase().includes('electric') || rawFuel.toLowerCase().includes('bev'))) {
                        fixedFuel = 'electric';
                    }

                    // B. 修复日期 (Registration Due Date)
                    let fixedRegDate = record.registration_due_date ? new Date(record.registration_due_date) : new Date();

                    // C. 确定最终字段
                    let finalMakeStr = decodedData.make || record.make || 'Unknown';
                    let finalModelStr = decodedData.model || record.model || 'Unknown';
                    let finalYear = decodedData.year || record.year || '2022';
                    let finalNickname = record.nickname || decodedData.body_class || finalModelStr;

                    // ==========================================
                    // 🏗️ 数据库 ID 映射 (Make/Model ID Lookup)
                    // ==========================================
                    // (保留你原来的逻辑，防止数据库因为找不到 ID 而报错)

                    // 处理 Make ID
                    let makeDoc = await makeDbHandler.getByQuery({ title: { $regex: new RegExp(`^${finalMakeStr}$`, "i") } });
                    let makeId;
                    if (makeDoc.length) {
                        makeId = makeDoc[0]._id;
                    } else {
                        let newMake = await makeDbHandler.create({ title: finalMakeStr });
                        makeId = newMake._id;
                    }

                    // 处理 Model ID
                    let modelDoc = await modelDbHandler.getByQuery({ title: { $regex: new RegExp(`^${finalModelStr}$`, "i") }, make_id: makeId });
                    let modelId;
                    if (modelDoc.length) {
                        modelId = modelDoc[0]._id;
                    } else {
                        let newModel = await modelDbHandler.create({ title: finalModelStr, make_id: makeId });
                        modelId = newModel._id;
                    }

                    // ==========================================
                    // 💾 保存数据 (Save)
                    // ==========================================
                    let submitData = {
                        user_id: id,
                        company: req.body.company || userData[0].company_id, // 确保有公司ID

                        identification_number: vin,
                        nickname: finalNickname,
                        license_plate: record.license_plate || '',
                        
                        year: finalYear,
                        make: makeId,   // ✅ 存的是 ID
                        model: modelId, // ✅ 存的是 ID
                        
                        color: record.color || 'White',
                        gas_electric: fixedFuel,             // ✅ 修复后的值 (gas/electric)
                        registration_due_date: fixedRegDate, // ✅ 修复后的值 (Date)
                        
                        status: 'active',
                        media: [],
                        document: []
                    };

                    await VehicleDbHandler.create(submitData); // ✅ 改成了大写 V
                    response.successCount++;

                } catch (error) {
                    console.error('❌ Failed to save record:', error.message);
                    response.failureCount++;
                    response.failedRecords.push({ record: record.identification_number, reason: error.message });
                }
            }
            
            // 清理文件 (Correctly placed INSIDE the try block, but AFTER the loop)
            if (fs.existsSync(`./excel/${filePath}`)) {
                fs.unlinkSync(`./excel/${filePath}`);
            }

            responseData.msg = `Upload complete! Success: ${response.successCount}, Failed: ${response.failureCount}`;
            responseData.data = response;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to process bulk upload:', error);
            responseData.msg = 'Failed to process bulk upload!';
            return responseHelper.error(res, responseData);
        }
    },

    GetVehicle: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request for get vehicle with id:', id);
        const limit = parseInt(req.query.limit) || 10; 
        const skip = parseInt(req.query.skip) || 0; 
        const searchValue = req.body.search || '';
        const is_defleet = req.body.is_defleet || '';
        // 🚀 修改点 1：在这里加入了 year, gas_electric, color
        const { make, model, status, year, fuel_type, color } = req.body;
        let responseData = {};

        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let query = { user_id: mongoose.Types.ObjectId(id), is_deleted: false };

            // 🚀 修改点 2：在这里加上了三个新的筛选条件
            if (year) {
                query.year = year;
            }
            if (fuel_type) { // 🚀 确保这里用的是 fuel_type
                query.gas_electric = fuel_type;
            }

            if (color) {
                query.color = { $regex: color, $options: 'i' }; // 使用正则，忽略大小写，防止前端传进来大小写不一致
            }

            if (make) {
                const makeMatches = await makeDbHandler.getByQuery({
                    title: { $regex: make, $options: 'i' }
                }).lean();
                const makeIds = makeMatches.map(make => make._id);
                if (makeIds.length) {
                    query.make = { $in: makeIds };
                }
            }

            if (model) {
                const modelMatches = await modelDbHandler.getByQuery({
                    title: { $regex: model, $options: 'i' }
                }).lean();
                const modelIds = modelMatches.map(model => model._id);
                if (modelIds.length) {
                    query.model = { $in: modelIds };
                }
            }

            if (searchValue) {
                query.$or = [
                    { identification_number: { $regex: searchValue, $options: 'i' } },
                    { nickname: { $regex: searchValue, $options: 'i' } },
                    { license_plate: { $regex: searchValue, $options: 'i' } },
                ];
            }

            if (is_defleet) {
                const today = moment().utc().startOf('day').toISOString(); 
                if (is_defleet === 'true') {
                    query.de_fleet = { $ne: '', $lte: today };
                } else if (is_defleet === 'false') {
                    query.$or = [
                        { de_fleet: { $exists: false } },
                        { de_fleet: { $gt: today } }
                    ];
                }
            }

            let vehicles = await VehicleDbHandler.getByQuery(query)
                .populate('make')
                .populate('model')
                .lean();

            const vehicleIds = vehicles.map(vehicle => vehicle._id);
            const inServiceJobs = await MainJobDbHandler.getByQuery({
                vehicle_id: { $in: vehicleIds },
                status: { $nin: ['completed', 'rejected', 'draft'] }
            }).lean();

            const inServiceVehicleIds = new Set(inServiceJobs.map(job => job.vehicle_id.toString()));

            vehicles = vehicles.map(vehicle => ({
                ...vehicle,
                inService: inServiceVehicleIds.has(vehicle._id.toString()),
                de_fleeted: vehicle.de_fleet ? moment(vehicle.de_fleet).isSameOrBefore(moment().utc().startOf('day').format('YYYY-MM-DD')) : false
            }));

            if (status === "inService") {
                vehicles = vehicles.filter(vehicle => vehicle.inService === true && vehicle.de_fleeted === false);
            } else if (status === "available") {
                vehicles = vehicles.filter(vehicle => vehicle.inService === false && vehicle.de_fleeted === false);
            }

            const totalRecords = vehicles.length; 
            vehicles = vehicles.slice(skip, skip + limit);

            responseData.msg = "Data fetched!";
            responseData.data = {
                vehicles,
                totalRecords
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = 'failed to get data!';
            return responseHelper.error(res, responseData);
        }
    },

    GetVehicleDetail: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        let vehicleId = req.params.vehicleId;
        log.info('Received request for get vehicle with id:', id);
        let responseData = {};

        try {
            let userData = await userDbHandler.getByQuery({ _id: id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let VehicleData = await VehicleDbHandler.getByQuery({ _id: vehicleId, user_id: id, is_deleted: false }).populate('make')
                .populate('model').lean();
            if (!VehicleData) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }
            const inServiceJobs = await MainJobDbHandler.getByQuery({
                vehicle_id: vehicleId,
                status: { $nin: ['completed', 'rejected', 'draft'] }
            }).lean();

            const inServiceVehicleIds = new Set(inServiceJobs.map(job => job.vehicle_id.toString()));
            VehicleData[0].inService = inServiceVehicleIds.has(VehicleData[0]._id.toString());
            VehicleData[0].de_fleeted = VehicleData[0].de_fleet ? moment(VehicleData[0].de_fleet).isSameOrBefore(moment().utc().startOf('day').format('YYYY-MM-DD')) : false;
            VehicleData[0].de_fleeted_date = VehicleData[0].de_fleet ? moment(VehicleData[0].de_fleet).format('YYYY-MM-DD') : null;

            responseData.msg = 'Data fetched!';
            responseData.data = VehicleData[0];
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get data with error::', error);
            responseData.msg = 'failed to get data!';
            return responseHelper.error(res, responseData);
        }
    },
    
    GetBrandStatistics: async (req, res) => {
        let userId = req.user.sub;
        // 🚀 获取前端传来的所有可能字段
        const { year, brand: brandId, make, yearFilters } = req.body;
        
        let selectedYear = year || (yearFilters && yearFilters[0]?.year) || "";
        if (selectedYear === "All") selectedYear = "";

        let responseData = {};

        try {
            // 1. 分母永远是全车队的总数
            const allVehicles = await VehicleDbHandler.getByQuery({ 
                user_id: mongoose.Types.ObjectId(userId), 
                is_deleted: false 
            });
            const totalFleetCount = allVehicles.length;

            // 2. 构造查询条件
            let matchStage = { user_id: mongoose.Types.ObjectId(userId), is_deleted: false };
            
            // 🚀 如果是侧边栏请求，精准过滤该品牌
            if (brandId) {
                matchStage.make = mongoose.Types.ObjectId(brandId);
            }
            // 🚀 如果是主页搜索
            if (make) {
                const makeMatches = await makeDbHandler.getByQuery({ title: { $regex: make, $options: 'i' } }).lean();
                matchStage.make = { $in: makeMatches.map(m => m._id) };
            }

            let brandStatistics = await VehicleAggregate.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { make: "$make", model: "$model", year: "$year" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.make",
                        totalBrandCars: { $sum: "$count" },
                        details: { $push: { modelId: "$_id.model", year: "$_id.year", count: "$count" } }
                    }
                },
                { $lookup: { from: 'makes', localField: '_id', foreignField: '_id', as: 'brand' } },
                { $unwind: "$brand" },
                { $lookup: { from: 'models', localField: 'details.modelId', foreignField: '_id', as: 'modelDetails' } }
            ]);

            brandStatistics = brandStatistics.map(brand => {
                brand.yearPercentage = totalFleetCount > 0 ? ((brand.totalBrandCars / totalFleetCount) * 100).toFixed(2) : 0;

                let modelMap = {};
                let currentFilterSum = 0;

                brand.details.forEach(item => {
                    const modelDetail = brand.modelDetails.find(d => d._id.toString() === item.modelId.toString());
                    const modelName = modelDetail ? modelDetail.title : 'Unknown';
                    
                    // 🚀 根据年份过滤侧边栏数据
                    if (!selectedYear || item.year === selectedYear.toString()) {
                        if (!modelMap[modelName]) {
                            modelMap[modelName] = { model: { title: modelName }, count: 0 };
                        }
                        modelMap[modelName].count += item.count;
                        currentFilterSum += item.count;
                    }
                });

                brand.models = Object.values(modelMap); 
                brand.yearCarsSum = currentFilterSum;   // 🚀 侧边栏的 Units 数量
                brand.totalCars = brand.totalBrandCars; // 🚀 主卡片的 Total Units

                return brand;
            }).filter(item => item.brand && item.brand.title);

            responseData.data = brandStatistics;
            return responseHelper.success(res, responseData);

        } catch (error) {
            return responseHelper.error(res, { msg: 'Stats failed' });
        }
    },

    GetCarsByBrandStatus: async (req, res) => {
        let user = req.user;
        let userId = user.sub;
        let brandName = req.body.brand;
        let modelSearch = req.body.model || ''; 
        log.info('Received request for cars by brand with user id:', userId, 'and brand:', brandName, 'and model search:', modelSearch);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let make = await makeDbHandler.getByQuery({ title: brandName });
            if (!make.length) {
                responseData.msg = 'Brand not found!';
                return responseHelper.error(res, responseData);
            }
            let makeId = make[0]._id;

            let vehicles = await VehicleDbHandler.getByQuery({ make: makeId, user_id: userId }).populate('model');

            if (!vehicles.length) {
                responseData.msg = "No vehicles found for this brand!";
                responseData.data = {
                    inService: [],
                    notInService: []
                };
                return responseHelper.success(res, responseData);
            }

            let vehicleIds = vehicles.map(vehicle => vehicle._id);
            let serviceJobs = await MainJobDbHandler.getByQuery({
                vehicle_id: { $in: vehicleIds },
                status: { $ne: "completed" }
            });

            let vehiclesInService = [];
            let vehiclesNotInService = [];

            vehicles.forEach(vehicle => {
                const inService = serviceJobs.some(job => job.vehicle_id.equals(vehicle._id));
                if (inService) {
                    vehiclesInService.push(vehicle);
                } else {
                    vehiclesNotInService.push(vehicle);
                }
            });

            const filterByModel = (vehicles) => {
                return vehicles.filter(vehicle => vehicle.model.title.toLowerCase().includes(modelSearch.toLowerCase()));
            };

            vehiclesInService = filterByModel(vehiclesInService);
            vehiclesNotInService = filterByModel(vehiclesNotInService);

            const segregateByModel = (vehicles) => {
                return vehicles.reduce((result, vehicle) => {
                    const modelName = vehicle.model.title;
                    if (!result[modelName]) {
                        result[modelName] = [];
                    }
                    result[modelName].push(vehicle);
                    return result;
                }, {});
            };

            const inServiceByModel = segregateByModel(vehiclesInService);
            const notInServiceByModel = segregateByModel(vehiclesNotInService);

            const formatResponse = (segregatedData) => {
                return Object.keys(segregatedData).map(modelName => ({
                    model: modelName,
                    vehicles: segregatedData[modelName]
                }));
            };

            responseData.msg = "Cars by brand status fetched successfully!";
            responseData.data = {
                inService: formatResponse(inServiceByModel),
                notInService: formatResponse(notInServiceByModel)
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get cars by brand status with error::', error);
            responseData.msg = 'Failed to get cars by brand status!';
            return responseHelper.error(res, responseData);
        }
    },

    UpdateVehicle: async (req, res) => {
        let reqObj = req.body;
        let user_id = req.user.sub;
        let id = req.params.id;
        log.info('Received request for update vehicle with id:', id);
        let responseData = {};
        try {
            let userData = await userDbHandler.getByQuery({ _id: user_id, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let vehicleData = await VehicleDbHandler.getByQuery({ _id: id, user_id: user_id });
            if (!vehicleData.length) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }

            let checkVehicle = await VehicleDbHandler.getByQuery({
                $or: [
                    { identification_number: reqObj.identification_number },
                    { license_plate: reqObj.license_plate }
                ], _id: { $ne: id }
            });
            if (checkVehicle.length) {
                responseData.msg = 'Vehicle with this identification number or license plate already exists!';
                return responseHelper.error(res, responseData);
            }
            
            let make = await makeDbHandler.getByQuery({ title: reqObj.make });
            let makeId;

            if (make.length) {
                makeId = make[0]._id; 
            } else {
                let newMake = await makeDbHandler.create({ title: reqObj.make, image: reqObj.make_image || '' });
                makeId = newMake._id; 
            }

            let model = await modelDbHandler.getByQuery({ title: reqObj.model, make_id: makeId });
            let modelId;

            if (model.length) {
                modelId = model[0]._id; 
            } else {
                let newModel = await modelDbHandler.create({ title: reqObj.model, make_id: makeId });
                modelId = newModel._id; 
            }

            let media = vehicleData[0].media || [];
            let document = vehicleData[0].document || [];

            let mediaToDelete = reqObj.delete_media ? reqObj.delete_media.split(',').map(item => item.trim()) : [];
            let documentsToDelete = reqObj.delete_documents ? reqObj.delete_documents.split(',').map(item => item.trim()) : [];

            if (mediaToDelete.length > 0) {
                media = media.filter(image => !mediaToDelete.includes(image));
            }
            if (documentsToDelete.length > 0) {
                document = document.filter(doc => !documentsToDelete.includes(doc));
            }

            if (req.files && req.files.media) {
                for (let i = 0; i < req.files.media.length; i++) {
                    media.push(req.files.media[i].location);
                }
            }
            if (req.files && req.files.document) {
                for (let i = 0; i < req.files.document.length; i++) {
                    document.push(req.files.document[i].location);
                }
            }

            let updateData = {
                identification_number: reqObj.identification_number,
                nickname: reqObj.nickname,
                year: reqObj.year,
                make: makeId, 
                model: modelId, 
                color: reqObj.color,
                registration_due_date: reqObj.registration_due_date,
                issue_date: reqObj.issue_date,
                registration_place: reqObj.registration_place,
                in_fleet: reqObj.in_fleet,
                de_fleet: reqObj.de_fleet,
                last_oil_change: reqObj.last_oil_change,
                license_plate: reqObj.license_plate,
                gas_electric: reqObj.gas_electric,
                address: {
                    street: reqObj.street,
                    address: reqObj.address,
                    city: reqObj.city,
                    district: reqObj.district,
                    state: reqObj.state,
                    pin: reqObj.pin,
                    country: reqObj.country,
                },
                location: {
                    type: 'Point',
                    coordinates: reqObj.coordinates,
                },
                media: media,
                document: document,
            };

            let saveData = await VehicleDbHandler.updateById(id, updateData);
            responseData.msg = `Data updated!`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = 'failed to update data!';
            return responseHelper.error(res, responseData);
        }
    },

    BulkDeleteVehicles: async (req, res) => {
        let responseData = {};
        let response = {
            deletedCount: 0,
            skippedCount: 0,
            skippedVehicles: []
        };
        let user = req.user;
        let userId = user.sub;
        log.info('Received bulk delete request.');

        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let vehicleIds = req.body.vehicleIds.split(',');

            for (let vehicleId of vehicleIds) {
                try {
                    let vehicle = await VehicleDbHandler.getByQuery({ _id: vehicleId, user_id: userId });

                    if (!vehicle.length) {
                        response.skippedCount++;
                        response.skippedVehicles.push({ vehicleId, reason: 'Vehicle does not belong to the user.' });
                        continue;
                    }

                    let inProgressService = await MainJobDbHandler.getByQuery({ vehicle_id: vehicleId, status: 'in-progress' });

                    if (inProgressService.length) {
                        response.skippedCount++;
                        response.skippedVehicles.push({ vehicleId, reason: 'Service in progress.' });
                        continue;
                    }

                    await VehicleDbHandler.updateByQuery(
                        { _id: vehicleId }, 
                        { 
                            is_deleted: true, 
                            de_fleet: moment().utc().startOf('day').format("YYYY-MM-DD") 
                        }
                    );

                    response.deletedCount++;
                } catch (error) {
                    log.error('Failed to delete vehicle:', vehicleId, 'Error:', error);
                    response.skippedCount++;
                    response.skippedVehicles.push({ vehicleId, reason: 'Failed due to error.' });
                }
            }

            responseData.msg = vehicleIds.length > 1 ? 'Bulk delete completed!' : 'Vehicle deleted!';
            responseData.data = response;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to process bulk delete:', error);
            responseData.msg = 'Failed to process bulk delete!';
            return responseHelper.error(res, responseData);
        }
    },

    getMakes: async (req, res) => {
        let responseData = {};
        try {
            let makes = await makeDbHandler.getByQuery({});
            responseData.msg = "Makes fetched successfully!";
            responseData.data = makes;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch makes with error::', error);
            responseData.msg = "Failed to fetch makes";
            return responseHelper.error(res, responseData);
        }
    },

    getModels: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let models = await modelDbHandler.getByQuery({ make_id: id }).populate('make_id', 'title');
            responseData.msg = "Models fetched successfully!";
            responseData.data = models;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch models with error::', error);
            responseData.msg = "Failed to fetch models";
            return responseHelper.error(res, responseData);
        }
    },
    
    DeleteVehicleMedia: async (req, res) => {
        let { vehicleId, media, documents } = req.body; 
        let user = req.user;
        let userId = user.sub;
        let responseData = {};

        try {
            let userData = await userDbHandler.getByQuery({ _id: userId, user_role: 'fleet' });
            if (!userData.length) {
                responseData.msg = 'Invalid login or token expired!';
                return responseHelper.error(res, responseData);
            }

            let vehicle = await VehicleDbHandler.getById(vehicleId);
            if (!vehicle) {
                responseData.msg = 'Vehicle not found!';
                return responseHelper.error(res, responseData);
            }

            let mediaToDelete = media ? media.split(',').map(item => item.trim()) : [];
            let documentsToDelete = documents ? documents.split(',').map(item => item.trim()) : [];

            if (mediaToDelete.length > 0) {
                vehicle.media = vehicle.media.filter(image => !mediaToDelete.includes(image));
            }

            if (documentsToDelete.length > 0) {
                vehicle.document = vehicle.document.filter(doc => !documentsToDelete.includes(doc));
            }

            await VehicleDbHandler.updateById(vehicleId, { media: vehicle.media, document: vehicle.document });
            responseData.msg = 'Media deleted successfully!';
            return responseHelper.success(res, responseData);

       } catch (error) {
            log.error('Failed to delete images/documents with error::', error);
            responseData.msg = 'Failed to delete media!';
            return responseHelper.error(res, responseData);
        }
    },
 
    getVehicleDetailsByVin: async (req, res) => {
        try {
            const { vin } = req.params; 
            
            if (!vin) {
                return res.status(400).json({ status: false, message: "VIN is required" });
            }

            const result = await decodeVin(vin);

            if (!result.success) {
                return res.status(404).json({ status: false, message: result.message });
            }

            return res.status(200).json({
                status: true,
                message: "Vehicle decoded successfully",
                data: result.data
            });

        } catch (error) {
            console.error("Controller Error:", error);
            return res.status(500).json({ status: false, message: "Internal Server Error" });
        }
    },
   // ✅ 3. 获取服务下拉菜单列表
    GetServiceCategories: async (req, res) => {
        let responseData = {};
        try {
            // 只拉取激活状态的服务
            let categories = await ServiceCategoryDbHandler.getByQuery({ is_active: true });
            
            // 如果数据库是空的，我们先塞几个默认的进去（自动初始化，省得你去数据库手敲！）
            if (!categories.length) {
                const defaultServices = [
                    { title: "Tires", description: "Tire repair and replacement" },
                    { title: "Towing", description: "Towing service" },
                    { title: "Cleaning", description: "Vehicle cleaning and detailing" },
                    { title: "Light Mechanical", description: "Basic mechanical repairs" },
                    { title: "Heavy Mechanical", description: "Major mechanical repairs" },
                    { title: "Glass", description: "Windshield and glass repair" }
                ];
                await Promise.all(defaultServices.map(s => ServiceCategoryDbHandler.create(s)));
                categories = await ServiceCategoryDbHandler.getByQuery({ is_active: true });
            }

            responseData.msg = "Service categories fetched successfully!";
            responseData.data = categories;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to fetch service categories with error::', error);
            responseData.msg = "Failed to fetch service categories";
            return responseHelper.error(res, responseData);
        }
    }

};

