const axios = require('axios');

const decodeVin = async (vin) => {
    try {
        console.log(`🔍 Decoding VIN: ${vin}...`);
        
        // 1. Call NHTSA API
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data || !data.Results) {
            throw new Error('Invalid VIN or API Error');
        }

        // 2. Extract Key Information (辅助函数)
        const getField = (variableName) => {
            const item = data.Results.find(r => r.Variable === variableName);
            return (item && item.Value && item.Value !== "Not Applicable") ? item.Value : null;
        };

        const vehicleInfo = {
            vin: vin,
            year: getField('Model Year'),
            make: getField('Make'),
            model: getField('Model'),
            type: getField('Vehicle Type'),
            fuel: getField('Fuel Type - Primary'),
            // 🔥 新增：产地信息 (可以填到 Country 字段)
            country: getField('Plant Country'), 
            manufacturer: getField('Manufacturer Name'),
            body_class: getField('Body Class'),
            error: data.Results[0]?.Value.includes('!') ? data.Results[0].Value : null 
        };

        console.log("✅ VIN Decoded Successfully!", vehicleInfo);
        return { success: true, data: vehicleInfo };

    } catch (error) {
        console.error("❌ VIN Service Error:", error.message);
        return { success: false, message: error.message };
    }
};

module.exports = { decodeVin };