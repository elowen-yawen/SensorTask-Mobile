const express = require('express');
const router = express.Router();

// Controllers
const getSensorData = require('../controllers/getSensorData');
const getDataByType = require('../controllers/getDataByType');
const getDeviceManageData = require('../controllers/getDeviceManageData');
const getErrData = require('../controllers/getErrData');
const getErrTypeStats = require('../controllers/getErrTypeStats');
const getDirectTree = require('../controllers/getDirectTree');
const getDirectRender = require('../controllers/getDirectRender');

// Service: deviceData
const addDeviceData = require('../service/deviceData/addDeviceData');
const deleteDeviceData = require('../service/deviceData/deleteDeviceData');
const updateDeviceData = require('../service/deviceData/updateDeviceData');

// Service: directData
const updateMultipleDirectData = require('../service/directData/updateMultipleDirectData');
const updateDirectDataAndPublish = require('../service/directData/updateDirectDataAndPublish');

// Sensor data
router.get('/data', getSensorData);
router.get('/dataByType', getDataByType);

// Device management
router.get('/deviceData', getDeviceManageData);
router.post('/deviceData/add', addDeviceData);
router.post('/deviceData/delete', deleteDeviceData);
router.post('/deviceData/update', updateDeviceData);

// Error data
router.get('/errData', getErrData);
router.get('/errTypeStats', getErrTypeStats);

// Direct command configuration
router.get('/directData', getDirectTree);
router.get('/directRender', getDirectRender);
router.post('/multipleDirectData', updateMultipleDirectData);
router.post('/directData/update', updateDirectDataAndPublish);

module.exports = router;
