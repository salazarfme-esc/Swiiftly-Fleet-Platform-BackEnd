'use strict';
const logger = require('../../../services/logger');
const log = new logger('AdminAuthController').getChildLogger();
const dbService = require('../../../services/db/services');
const bcrypt = require('bcryptjs');
const jwtService = require('../../../services/jwt');
const responseHelper = require('../../../services/customResponse');
const adminDbHandler = dbService.Admin;
const contactInfoDbHandler = dbService.ContactInfo;
const verificationDbHandler = dbService.AdminVerification;
const VendorInvoiceDbHandler = dbService.vendorInvoice;
const FleetInvoiceDbHandler = dbService.FleetInvoice;
const VendorInvoiceDbAggregate = require('../../../services/db/models/vendorInvoice.js');
const FleetInvoiceDbAggregate = require('../../../services/db/models/fleetInvoice.js');
const UserDbAggregate = require('../../../services/db/models/user.js');
const AdminDbAggregate = require('../../../services/db/models/admin.js');
const UserDbHandler = dbService.User;
const MainJobDbHandler = dbService.MainJob;
const FeedbackDbHandler = dbService.Feedback;
const NotificationDbHandler = dbService.Notification;
const config = require('../../../config/environments');
const templates = require('../../../utils/templates/template');
const emailService = require('../../../services/sendEmail');
const crypto = require('crypto');
const moment = require('moment');

/*******************
 * PRIVATE FUNCTIONS
 ********************/
/**
 * Method to Compare password
 */
let _comparePassword = (reqPassword, userPassword) => {
    return new Promise((resolve, reject) => {
        //compare password with bcrypt method, password and hashed password both are required
        bcrypt.compare(reqPassword, userPassword, function (err, isMatch) {
            if (err) reject(err);
            resolve(isMatch);
        });
    });
};

// Method to create hash password on update
let _createHashPassword = async (password) => {
    let salt = config.bcrypt.saltValue;
    const saltpass = await bcrypt.genSalt(salt);
    // now we set user password to hashed password
    let hashedPassword = await bcrypt.hash(password, saltpass);
    return hashedPassword;
}

/**
 * Method to generate jwt token
 */
let _generateAdminToken = (tokenData) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAdminAuthenticationToken(tokenData);
    return token;
};
let _encryptPassword = (password) => {
    let salt = config.bcrypt.saltValue;
    // generate a salt
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(salt, function (err, salt) {
            if (err) reject(err);
            // hash the password with new salt
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) reject(err);
                // override the plain password with the hashed one
                resolve(hash);
            });
        });
    });
};
function generateStrongPassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}





// Helper function to get invoice graph data
const getInvoiceGraphData = async (year, filterType) => {
    const startDate = moment(`${year}-01-01`).startOf('year');
    const endDate = moment(`${year}-12-31`).endOf('year');

    let matchCriteria = {
        invoice_date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    };

    if (filterType === 'vendor') {
        matchCriteria.vendor_id = { $exists: true };
    } else if (filterType === 'fleet') {
        matchCriteria.fleet_id = { $exists: true };
    }

    const vendorInvoices = await VendorInvoiceDbAggregate.aggregate([
        { $match: matchCriteria },
        {
            $group: {
                _id: { $month: "$invoice_date" },
                totalAmount: { $sum: "$total_amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } } // Sort by month
    ]);

    const fleetInvoices = await FleetInvoiceDbAggregate.aggregate([
        { $match: matchCriteria },
        {
            $group: {
                _id: { $month: "$invoice_date" },
                totalAmount: { $sum: "$total_amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } } // Sort by month
    ]);

    // Combine results
    const combinedData = [];
    for (let month = 1; month <= 12; month++) {
        const vendorData = vendorInvoices.find(v => v._id === month) || { totalAmount: 0, count: 0 };
        const fleetData = fleetInvoices.find(f => f._id === month) || { totalAmount: 0, count: 0 };

        combinedData.push({
            month,
            totalAmount: vendorData.totalAmount + fleetData.totalAmount,
            count: vendorData.count + fleetData.count
        });
    }

    return combinedData;
};

// Helper function to get user count graph data
const getUserCountGraphData = async (year, filterType) => {
    const startDate = moment(`${year}-01-01`).startOf('year');
    const endDate = moment(`${year}-12-31`).endOf('year');

    let matchCriteria = {
        created_at: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    };

    if (filterType === 'vendor') {
        matchCriteria.user_role = 'vendor';
    } else if (filterType === 'fleet') {
        matchCriteria.user_role = 'fleet';
    }
    let userCountData = [];

    if (filterType === 'company') {
        matchCriteria.is_company = true;
        userCountData = await AdminDbAggregate.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: { $month: "$created_at" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by month
        ])

    } else {
        userCountData = await UserDbAggregate.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: { $month: "$created_at" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by month
        ])
    }


    // Prepare the final data structure
    const userCountGraphData = [];
    for (let month = 1; month <= 12; month++) {
        const userData = userCountData.find(u => u._id === month) || { count: 0 };
        userCountGraphData.push({
            month,
            count: userData.count
        });
    }

    return userCountGraphData;
};
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to handle admin login
     */
    login: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for Admin Login:', reqObj);
        let responseData = {};
        try {
            let superAdminEmail = 'admin@swiiftly.com';
            let query = {
                email: reqObj.email,
                is_deleted: false, // Check if the admin is not deleted
                is_active: true    // Check if the admin is active
            };

            // Check if admin email is present in the database, then only login request will process
            let adminData = await adminDbHandler.getByQuery(query).lean();

            if (adminData.length) {
                log.info('Admin login found', adminData);
                let reqPassword = reqObj.password;
                let adminPassword = adminData[0].password;

                // Compare request body password and stored password
                let isPasswordMatch = await _comparePassword(reqPassword, adminPassword);

                if (!isPasswordMatch) {
                    responseData.msg = 'Incorrect Password';
                    return responseHelper.error(res, responseData);
                }

                // If the user is super admin, ensure the role and permissions are set
                if (reqObj.email === superAdminEmail) {
                    adminData[0].role = "super_admin";
                    adminData[0].permissions = [
                        {
                            "tab": "Dashboard",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Vendor",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Work Flow",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Invoices",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Fleet Manager",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Reports",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Service Request",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Feedback",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Company",
                            "read": true,
                            "edit": true
                        },
                        {
                            "tab": "Roles",
                            "read": true,
                            "edit": true
                        }
                    ];
                }

                // Generate JWT token and update last login
                let tokenData = { sub: adminData[0]._id, email: adminData[0].email };
                await adminDbHandler.updateById(adminData[0]._id, { last_login: new Date() });
                let jwtToken = _generateAdminToken(tokenData);
                adminData[0].token = jwtToken;
                responseData.msg = 'Welcome';
                responseData.data = adminData[0];
                return responseHelper.success(res, responseData);
            } else if (reqObj.email === superAdminEmail) {
                // Create a new super admin if not found in database
                reqObj.last_login = new Date();
                reqObj.role = "super_admin";
                reqObj.permissions = [
                    {
                        "tab": "Dashboard",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Vendor",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Work Flow",
                        "read": true,
                        "edit": true
                    },



                    {
                        "tab": "Invoices",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Fleet Manager",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Reports",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Service Request",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Feedback",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Company",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Roles",
                        "read": true,
                        "edit": true
                    }
                ];

                // Create new admin entry
                let newAdmin = await adminDbHandler.create(reqObj);
                log.info('New super admin created', newAdmin);

                // Generate JWT token
                let tokenData = { sub: newAdmin._id, email: newAdmin.email };
                newAdmin = await adminDbHandler.getById(newAdmin._id).lean();
                let jwtToken = _generateAdminToken(tokenData);
                newAdmin.token = jwtToken;
                responseData.msg = 'Welcome';
                responseData.data = newAdmin;
                return responseHelper.success(res, responseData);
            }

            responseData.msg = 'Admin doesn\'t exist or is inactive/deleted';
            return responseHelper.error(res, responseData);
        } catch (error) {
            log.error('Failed to get admin login with error::', error);
            responseData.msg = 'Failed to get admin login';
            return responseHelper.error(res, responseData);
        }
    },


    getAllAdmin: async (req, res) => {
        let responseData = {};
        const limit = parseInt(req.query.limit); // Default limit
        const skip = parseInt(req.query.skip); // Default skip
        const searchQuery = req.query.searchQuery || ''; // Get search query from request
        const role = req.query.role || '';
        try {
            // Build the search criteria
            let searchCriteria = {
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for name
                    { email: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for email
                    { role: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search for role
                ],
                is_company: false,
                _id: { $ne: req.admin.sub }
            };
            if (role === "company") {
                searchCriteria = {
                    is_company: true,
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for name
                        { email: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for email
                        { company_name: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search for role
                    ],
                    _id: { $ne: req.admin.sub }
                }
                // Fetch admin list with pagination, sorting, and search
                let getAdminList = await adminDbHandler.getByQuery(
                    searchCriteria,
                    { admin_password: 0 }
                ).skip(skip).limit(limit).sort({ created_at: -1 }).lean();

                getAdminList.map(async (item) => {
                    item.fleet_size = await UserDbHandler.getByQuery({ company_id: item._id }).countDocuments();
                })

                let getAdminListCount = await adminDbHandler.getByQuery(
                    searchCriteria,
                    { admin_password: 0 }
                ).countDocuments();
                responseData.msg = "Data fetched successfully!";
                responseData.data = { count: getAdminListCount, data: getAdminList };
                return responseHelper.success(res, responseData);
            }

            // Fetch admin list with pagination, sorting, and search
            let getAdminList = await adminDbHandler.getByQuery(
                searchCriteria,
                { admin_password: 0 }
            ).skip(skip).limit(limit).sort({ created_at: -1 });

            let getAdminListCount = await adminDbHandler.getByQuery(
                searchCriteria,
                { admin_password: 0 }
            ).countDocuments();

            responseData.msg = "Data fetched successfully!";
            responseData.data = { count: getAdminListCount, data: getAdminList };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getSingleAdmin: async (req, res) => {
        let responseData = {};
        let user = req.admin;
        let id = req.params.id;
        try {
            let getAdmin = await adminDbHandler.getById(id, { admin_password: 0 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = getAdmin;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    updateAdmin: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        let id = admin.sub;
        let reqObj = req.body;

        try {
            let getByQuery = await adminDbHandler.getByQuery({ _id: id });
            if (!getByQuery.length) {
                responseData.msg = "Admin not found!";
                return responseHelper.error(res, responseData);
            }
            let image = "";
            if (req.file) {
                image = req.file.location;
            }

            let updatedData = {
                name: reqObj.name,
                phone_number: reqObj.phone_number, // Update phone_number as well
                avatar: image
            };

            let updateAdmin = await adminDbHandler.updateById(id, updatedData);
            responseData.msg = "Data updated!";
            responseData.data = await adminDbHandler.getById(id);
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    },
    updateSubAdmin: async (req, res) => {
        let responseData = {};
        let adminId = req.params.id; // Assuming the admin ID is passed in the URL
        let admin = req.admin;
        let id = admin.sub;
        let reqObj = req.body;

        try {
            let getByQuery = await adminDbHandler.getByQuery({ _id: id });
            if (!getByQuery.length) {
                responseData.msg = "Admin not found!";
                return responseHelper.error(res, responseData);
            }
            // Fetch the existing admin data
            let existingAdmin = await adminDbHandler.getById(adminId);
            if (!existingAdmin) {
                responseData.msg = "Details not found!";
                return responseHelper.error(res, responseData);
            }

            // Prepare the updated data
            let updatedData = {
                name: reqObj.name,
                role: reqObj.role,
                phone_number: reqObj.phone_number,
                permissions: existingAdmin.is_company ? existingAdmin.permissions : reqObj.permissions
            };

            // Update the admin entry
            let updatedAdmin = await adminDbHandler.updateById(adminId, updatedData);
            responseData.msg = "Admin updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update admin with error::', error);
            responseData.msg = "Failed to update admin";
            return responseHelper.error(res, responseData);
        }
    },


    addAdmin: async (req, res) => {
        let responseData = {};
        let user = req.admin;
        let reqObj = req.body;

        try {
            // Check if the email already exists
            let getByQuery = await adminDbHandler.getByQuery({ email: reqObj.email });
            if (getByQuery.length) {
                responseData.msg = "This Email-Id is already taken";
                return responseHelper.error(res, responseData);
            }

            // Prepare the data for the new admin
            let Data = {
                name: reqObj.name,
                email: reqObj.email,
                password: generateStrongPassword(),
                phone_number: reqObj.phone_number,
                role: reqObj.role,
                permissions: reqObj.permissions || [],
                temporary_password: true,
                is_company: reqObj.is_company
            };
            // Include company name and business address if is_company is true
            if (reqObj.is_company) {
                Data.company_name = reqObj.company_name;
                Data.address = {
                    street: reqObj.address.street,
                    address: reqObj.address.address,
                    city: reqObj.address.city,
                    state: reqObj.address.state,
                    pin: reqObj.address.pin,
                    country: reqObj.address.country,
                }
                Data.permissions = [
                    {
                        "tab": "Dashboard",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Vendor",
                        "read": false,
                        "edit": false
                    },
                    {
                        "tab": "Work Flow",
                        "read": false,
                        "edit": false
                    },



                    {
                        "tab": "Invoices",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Fleet Manager",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Reports",
                        "read": false,
                        "edit": false
                    },
                    {
                        "tab": "Service Request",
                        "read": true,
                        "edit": true
                    },
                    {
                        "tab": "Feedback",
                        "read": false,
                        "edit": false
                    },
                    {
                        "tab": "Company",
                        "read": false,
                        "edit": false
                    },
                    {
                        "tab": "Roles",
                        "read": false,
                        "edit": false
                    }
                ]

                Data.location = {
                    type: 'Point',
                    coordinates: reqObj.address.coordinates,
                }
            }

            // Create the new admin entry
            let Admin = await adminDbHandler.create(Data);
            Data.is_admin = reqObj.is_company ? false : true;
            if (Admin) {
                let emailBody = {
                    recipientsAddress: Admin.email,
                    subject: 'Security Code for Account Verification',
                    body: templates.invitationToJoinAdmin(Data)
                };
                let emailInfo = await emailService.sendEmail(emailBody);
            }
            responseData.msg = "Admin added successfully!";
            responseData.data = Admin; // Optionally return the created admin data
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to add admin with error::', error);
            responseData.msg = "Failed to add admin";
            return responseHelper.error(res, responseData);
        }
    },
    forgotPasswordByEmail: async (req, res) => {
        let reqBody = req.body;
        log.info('Received request for Admin forgot password:', reqBody);
        let responseData = {};
        let isVerificationDataExists = false;
        try {
            let query = {
                email: req.body.email,
            };
            let userData = await adminDbHandler.getByQuery({ email: req.body.email });
            if (!userData.length) {
                log.error('Admin email does not exist for forget password request');
                responseData.msg = 'Admin is not registered with us';
                return responseHelper.error(res, responseData);
            }

            let verificationType = 'email';

            //check if user already have forgot password request data in verification collection
            let passwordQuery = {
                admin_id: userData[0]._id,
                verification_type: verificationType
            };
            let passwordTokenInfo = await verificationDbHandler.getByQuery(passwordQuery);
            let digits = '0123456789';
            let OTP = '';
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)];
            }
            //let OTP='1234';

            let otpBody = {
                otp: OTP,
                name: "Swiiftly-Admin"

            };

            //if password verification data found update it with new token, else create new entry
            if (passwordTokenInfo.length) {
                isVerificationDataExists = true;
                let updatePasswordVerificationObj = {
                    email: userData[0].email,
                    attempts: passwordTokenInfo[0].attempts + 1,
                    otp: otpBody.otp
                };

                let updatedVerificationData = await verificationDbHandler.updateById(passwordTokenInfo[0]._id, updatePasswordVerificationObj);
                log.info('password verification updated in the db', updatedVerificationData);
            }


            let emailBody = {
                recipientsAddress: userData[0].email,
                subject: 'OTP',
                body: templates.otpVerification(otpBody)
            };

            let emailInfo = await emailService.sendEmail(emailBody);


            //patch email verification templateBody
            let templateBody = {
                type: verificationType,
                email: userData[0].email,
                otp: otpBody.otp

            };
            if (!isVerificationDataExists) {
                // if(emailInfo) {
                //     log.info('Email verification mail sent successfully',emailInfo);
                //     responseData.msg = 'OTP have been sent on the registered Email-Id';
                //     return responseHelper.success(res,responseData);
                // }
                // let emailInfo = await emailService.sendEmail(emailBody);
                // log.info('password reset mail sent successfully', emailInfo);
                let passwordResetObj = {
                    admin_id: userData[0]._id,
                    email: userData[0].email,
                    verification_type: verificationType,
                    otp: otpBody.otp
                };
                let newPasswordVerification = await verificationDbHandler.create(passwordResetObj);
                log.info('new forgot password entry created successfully in the database', newPasswordVerification);
            }
            responseData.msg = 'Email validated and OTP is sent on your mail';
            responseData.data = templateBody;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process forget password request with error::', error);
            responseData.msg = 'failed to process forget password request';
            return responseHelper.error(res, responseData);
        }
    },

    verifyOtp: async (req, res) => {
        // let reQuery = req.query;
        // let decodedEmailToken = reQuery.token;
        let reqBody = req.body;
        log.info('Received request for otp verification ::', reqBody);
        let responseData = {};
        try {
            let verificationInfo = await verificationDbHandler.getByQuery({
                email: reqBody.email,
                otp: reqBody.otp
            });
            if (!verificationInfo.length) {
                responseData.msg = 'Otp expired or wrong otp';
                return responseHelper.error(res, responseData);
            }
            //update user email verification status
            let userId = verificationInfo[0].admin_id;
            let updateObj = {
                otp_verified: true
            };
            let updatedUser = await adminDbHandler.updateById(userId, updateObj);
            if (!updatedUser) {
                log.info('failed to verify otp');
                responseData.msg = 'failed to verify otp';
                return responseHelper.error(res, responseData);
            }
            log.info('user email verification status updated successfully', updatedUser);
            verificationInfo[0].otp = "";
            let updatedVerificationInfo = await verificationInfo[0].save();
            // let removedTokenInfo = await _handleVerificationDataUpdate(mobileInfo[0]._id);
            // log.info('mobile verification token has been removed::',removedTokenInfo);
            responseData.msg = 'Otp verified successfully';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process email verification::', error);
            responseData.msg = 'failed to verify Otp';
            return responseHelper.error(res, responseData);
        }
    },

    resetPassword: async (req, res) => {
        // let reQuery = req.query;
        // let decodedEmailToken = reQuery.token;
        let reqBody = req.body;
        log.info('Received request for password reset====>:', reqBody);
        let newPassword = reqBody.password;
        let responseData = {};
        try {
            let query = {
                email: reqBody.email,
            };
            let passwordTokenInfo = await verificationDbHandler.getByQuery(query);
            if (!passwordTokenInfo.length) {
                log.error('Invalid request');
                responseData.msg = 'Invalid Password reset request';
                return responseHelper.error(res, responseData);
            }
            // log.info("tokenInfo", passwordTokenInfo);
            let userId = passwordTokenInfo[0].admin_id;
            let userDetail = await adminDbHandler.getByQuery({ _id: userId });
            if (userDetail[0].otp_verified) {
                let encryptedPassword = await _encryptPassword(newPassword);
                let updateUserQuery = {
                    password: encryptedPassword
                };
                let updatedUser = await adminDbHandler.updateById(userId, updateUserQuery);
                if (!updatedUser) {
                    log.error('failed to reset user password. Please try again later', updatedUser);
                    responseData.msg = 'failed to reset user password. Please try again later';
                    return responseHelper.error(res, responseData);
                }
            }
            else {
                log.error('failed to reset user password. Otpnot verified');
                responseData.msg = 'Please verify otp to reset password !';
                return responseHelper.error(res, responseData);
            }
            let updateObj = {
                otp_verified: false

            };
            let updatedUser = await adminDbHandler.updateById(userId, updateObj);
            responseData.msg = 'Password updated successfully! Please Login to continue';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to reset password with error::', error);
            responseData.msg = 'failed to reset password';
            return responseHelper.error(res, responseData);
        }
    },

    changeAdminPassword: async (req, res) => {
        let reqObj = req.body;
        let admin = req.admin;
        let id = admin.sub;
        log.info('Received request for Admin password update:', reqObj);
        let responseData = {};

        try {
            let adminData = await adminDbHandler.getById(id);

            let comparePassword = await _comparePassword(reqObj.old_password, adminData.password);
            if (!comparePassword) {
                responseData.msg = "Invalid old password!";
                return responseHelper.error(res, responseData);
            }

            let compareNewAndOld = await _comparePassword(reqObj.new_password, adminData.password);
            if (compareNewAndOld) {
                responseData.msg = "New password must be different from old password!";
                return responseHelper.error(res, responseData);
            }

            let updatedObj = {
                password: await _createHashPassword(reqObj.new_password),
                temporary_password: false
            };

            let updateProfile = await adminDbHandler.updateById(id, updatedObj);
            responseData.msg = "Password updated successfully!";
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update password with error:', error);
            responseData.msg = "Failed to change password!";
            return responseHelper.error(res, responseData);
        }
    },

    deleteSubAdmin: async (req, res) => {
        let responseData = {};
        let adminId = req.params.id; // Assuming the admin ID is passed in the URL

        try {
            // Fetch the existing admin data
            let existingAdmin = await adminDbHandler.getById(adminId);
            if (!existingAdmin) {
                responseData.msg = "Admin not found!";
                return responseHelper.error(res, responseData);
            }
            let userData = await UserDbHandler.getByQuery({ company_id: existingAdmin._id }).skip(0).limit(1);
            if (existingAdmin.is_company && userData.length) {
                responseData.msg = "Company has users associated with them! Cannot delete company!";
                return responseHelper.error(res, responseData);
            }

            // Mark the admin as deleted
            await adminDbHandler.updateById(adminId, { is_deleted: req.query.is_deleted });
            responseData.msg = existingAdmin.is_company ? "Company deleted successfully!" : "Sub-admin deleted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to delete sub-admin with error::', error);
            responseData.msg = "Failed to delete sub-admin";
            return responseHelper.error(res, responseData);
        }
    },
    changeStatusSubAdmin: async (req, res) => {
        let responseData = {};
        let adminId = req.params.id; // Assuming the admin ID is passed in the URL

        try {
            // Fetch the existing admin data
            let existingAdmin = await adminDbHandler.getById(adminId);
            if (!existingAdmin) {
                responseData.msg = "Admin not found!";
                return responseHelper.error(res, responseData);
            }
            let updatedAdmin = await adminDbHandler.updateById(adminId, { is_active: req.query.is_active });
            if (updatedAdmin) {
                if (req.query.is_active === false) {
                    await UserDbHandler.updateByQuery({ company_id: adminId }, { is_delete: true });
                }
                else {
                    await UserDbHandler.updateByQuery({ company_id: adminId }, { is_delete: false });
                }
            }
            responseData.msg = "Status changed successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to change status for sub-admin with error::', error);
            responseData.msg = "Failed to change status!";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to get dashboard data
     */
    getDashboardData: async (req, res) => {
        let responseData = {};
        const { yearInvoices, filterTypeInvoices, yearUsers, filterTypeUsers } = req.query; // filterType can be 'all', 'fleet', or 'vendor'

        try {
            // 1. Total Service Requests from Main Jobs
            const totalServiceRequests = await MainJobDbHandler.getByQuery({}).countDocuments();

            // 2. Total Vendors from User table
            const totalVendors = await UserDbHandler.getByQuery({ user_role: 'vendor' }).countDocuments();
            const totalCompanies = await adminDbHandler.getByQuery({ is_company: true }).countDocuments();
            const totalFleets = await UserDbHandler.getByQuery({ user_role: 'fleet' }).countDocuments();

            // 3. Total Invoices from Vendor and Fleet Invoices
            const totalVendorInvoices = await VendorInvoiceDbHandler.getByQuery({}).countDocuments();
            const totalFleetInvoices = await FleetInvoiceDbHandler.getByQuery({}).countDocuments();
            const totalInvoices = totalVendorInvoices + totalFleetInvoices;
            const latest5Feedbacks = await FeedbackDbHandler.getByQuery({}).populate('user_id').sort({ createdAt: -1 }).limit(5);
            const latest5Notifications = await NotificationDbHandler.getByQuery({ notification_from_role: "vendor", notification_to_role: "admin", redirection_location: "admin_vendor_profile" }).sort({ createdAt: -1 }).limit(5);

            // 4. Get top 5 companies based on fleet count using aggregation
            const top5Companies = await UserDbAggregate.aggregate([
                { $match: { user_role: 'fleet' } }, // Match only fleet managers
                { $group: { _id: "$company_id", fleetCount: { $sum: 1 } } }, // Group by company_id and count fleets
                {
                    $lookup: { // Join with adminDbHandler to get company details
                        from: 'admins', // Assuming the collection name for companies is 'admins'
                        localField: '_id',
                        foreignField: '_id',
                        as: 'companyDetails'
                    }
                },
                { $unwind: "$companyDetails" }, // Unwind the company details array
                { $match: { "companyDetails.is_company": true } }, // Filter to include only companies
                { $sort: { fleetCount: -1 } }, // Sort by fleet count descending
                { $limit: 5 }, // Limit to top 5 companies
                {
                    $project: { // Project the desired fields
                        _id: 0,
                        companyId: "$companyDetails._id",
                        company_name: "$companyDetails.company_name",
                        address: "$companyDetails.address",
                        fleetCount: 1
                    }
                }
            ]);

            // Prepare response data
            responseData.data = {};
            responseData.data.totalServiceRequests = totalServiceRequests;
            responseData.data.totalVendors = totalVendors;
            responseData.data.totalCompanies = totalCompanies;
            responseData.data.totalFleets = totalFleets;
            responseData.data.totalInvoices = totalInvoices;
            responseData.data.top5Companies = top5Companies; // Add top 5 companies to response
            responseData.data.latest5Feedbacks = latest5Feedbacks;
            responseData.data.latest5Notifications = latest5Notifications;

            // Graph data for invoices
            const invoiceGraphData = await getInvoiceGraphData(yearInvoices, filterTypeInvoices);
            responseData.data.invoiceGraphData = invoiceGraphData;

            // Graph data for user count
            const userCountGraphData = await getUserCountGraphData(yearUsers, filterTypeUsers);
            responseData.data.userCountGraphData = userCountGraphData;

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get dashboard data with error::', error);
            responseData.msg = "Failed to get dashboard data";
            return responseHelper.error(res, responseData);
        }
    }

};