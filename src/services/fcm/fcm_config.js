let admin = require("firebase-admin");

let serviceAccount = require("./docsofy-android-firebase-adminsdk-dxb36-38cd474cf3.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://docsofy-android-default-rtdb.firebaseio.com',
});
module.exports.fcm_admin = admin;
