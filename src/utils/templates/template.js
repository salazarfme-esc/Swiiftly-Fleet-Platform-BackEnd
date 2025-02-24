'use strict';
const config = require('../../config/environments');
module.exports = {
    otpVerification: (data) => {
        let templateBody = `
                <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">

        <title>Swiiftly - OTP</title>
    
        <style>
            body {
                font-family: "Poppins", sans-serif;
            }

            @media screen and (max-width: 767px) {
                table {
                    width: 100%;
                }
                .logo {
                    width: 90%;
                }
                .policy {
                    display: inline-block !important;
                    text-align: center;
                }
                .policy li {
                    list-style: none;
                }
                    .gs li {
                margin-left: 0 !important;
                }
                input {
                    width: 100% !important;
                }
                .logo {
                    width: 100%;
                }
                ul.policy li {
                    display: block !important;
                    width: 100% !important;
                    margin-bottom: 10px !important;
                }
                h1 {
                    font-size: 20px;
                }
            }
        </style>
      </head>
      <body>
    
        <table border="0" cellpadding="0" cellspacing="0" style="max-width: 800px; width: 100%; margin: 0 auto;">
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="padding: 10px 0; width: 100%;">
                        <tr>
                            <td>
                                <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                               <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/otpBanner.png" width="100%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                                <h1>Hi ${data.name},</h1>
                                <p style="margin: 0;">Here is your One Time Password (OTP).</p>
                                <p style="margin: 0;">Please enter this code to verify your email address for <strong>Swiiftly</strong></p>
    
                                <form action="" style="margin: 30px 0;">
                                    <div class="mb-3">
                                      <input type="text" style="width: 250px;height: 50px;margin-right: 10px;border-radius: 6px;border: none;background-color: rgba(253, 183, 2, 0.2);text-align: center;font-size: 20px;font-weight: bold;letter-spacing: 20px;box-sizing: border-box;" value=${data.otp}>
                                      
                                    </div>
                                </form>
                                <p style="margin: 0 0 30px;">OTP will expire in <strong>10 minutes.</strong></p>
                                <p style="margin: 0;">Best Regards,</p>
                                <p style="margin: 0;"><strong>Swiiftly team.</strong></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
             <tr>
            <td>
                <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;border-top: 1px solid rgba(217, 217, 217, 1);border-bottom: 1px solid rgba(217, 217, 217, 1);margin: 50px 0;">
                    <tr>
                        <td width="50%">
                            <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                        </td>
                       <td width="50%" align="right">
                        <ul style="padding: 0;margin: 0;">
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.instagram.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/insta.png"  width="35" height="35" alt="instagram"/>
                                </a>
                            </li>
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.facebook.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/facebook.png" width="35" height="35" alt="facebook" />
                                </a>
                            </li>
                        </ul>
</td>

                    </tr>
                </table>
            </td>
        </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td align="center">
                                <p>© 2024 SWIIFTLY. All rights reserved.</p>
                                <p>You are receiving this mail because you registered to join the SWIIFTLY platform as a user or a creator. This also shows that you agree to our Terms of use and Privacy Policies. If you no longer want to receive mails from use.</p>
                                <ul class="policy" style="padding: 0;margin: 0 auto; width: 100%;text-align: center;">
                                    <li style="list-style: none;display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;list-style: none;color: #000000;border-bottom: 1px solid #333333;">Privacy policy</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Terms of service</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Help center</a></li>
                                </ul>
                             </td>
                        </tr>
                    </table>
                </td>
            </tr>
           
        </table>
      </body>
    </html>
        `;
        return templateBody;
    },

    ResetOtpVerification: (data) => {
        let templateBody = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">

        <title>Swiiftly - OTP</title>
    
        <style>
            body {
                font-family: "Poppins", sans-serif;
            }

            @media screen and (max-width: 767px) {
                table {
                    width: 100%;
                }
                .logo {
                    width: 90%;
                }
                .policy {
                    display: inline-block !important;
                    text-align: center;
                }
                .policy li {
                    list-style: none;
                }
                    .gs li {
                margin-left: 0 !important;
                }
                input {
                    width: 100% !important;
                }
                .logo {
                    width: 100%;
                }
                ul.policy li {
                    display: block !important;
                    width: 100% !important;
                    margin-bottom: 10px !important;
                }
                h1 {
                    font-size: 20px;
                }
            }
        </style>
      </head>
      <body>
    
        <table border="0" cellpadding="0" cellspacing="0" style="max-width: 800px; width: 100%; margin: 0 auto;">
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="padding: 10px 0; width: 100%;">
                        <tr>
                            <td>
                                <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                               <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/otpBanner.png" width="100%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                                <h1>Hi ${data.name},</h1>
                                <p style="margin: 0;">Here is your One Time Password (OTP).</p>
                                <p style="margin: 0;">Please enter this code to verify your email address for reset password request</p>
    
                                <form action="" style="margin: 30px 0;">
                                    <div class="mb-3">
                                      <input type="text" style="width: 250px;height: 50px;margin-right: 10px;border-radius: 6px;border: none;background-color: rgba(253, 183, 2, 0.2);text-align: center;font-size: 20px;font-weight: bold;letter-spacing: 20px;box-sizing: border-box;" value=${data.otp}>
                                      
                                    </div>
                                </form>
                                <p style="margin: 0 0 30px;">OTP will expire in <strong>10 minutes.</strong></p>
                                <p style="margin: 0;">Best Regards,</p>
                                <p style="margin: 0;"><strong>Swiiftly team.</strong></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
             <tr>
            <td>
                <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;border-top: 1px solid rgba(217, 217, 217, 1);border-bottom: 1px solid rgba(217, 217, 217, 1);margin: 50px 0;">
                    <tr>
                        <td width="50%">
                            <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                        </td>
                       <td width="50%" align="right">
                        <ul style="padding: 0;margin: 0;">
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.instagram.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/insta.png"  width="35" height="35" alt="instagram"/>
                                </a>
                            </li>
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.facebook.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/facebook.png" width="35" height="35" alt="facebook" />
                                </a>
                            </li>
                        </ul>
</td>

                    </tr>
                </table>
            </td>
        </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td align="center">
                                <p>© 2024 SWIIFTLY. All rights reserved.</p>
                                <p>You are receiving this mail because you registered to join the SWIIFTLY platform as a user or a creator. This also shows that you agree to our Terms of use and Privacy Policies. If you no longer want to receive mails from use.</p>
                                <ul class="policy" style="padding: 0;margin: 0 auto; width: 100%;text-align: center;">
                                    <li style="list-style: none;display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;list-style: none;color: #000000;border-bottom: 1px solid #333333;">Privacy policy</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Terms of service</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Help center</a></li>
                                </ul>
                             </td>
                        </tr>
                    </table>
                </td>
            </tr>
           
        </table>
      </body>
    </html>
        `;
        return templateBody;
    },
    invitationToJoinSWIIFTLY: (data) => {
        let templateBody = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">

        <title>Swiiftly</title>
    
        <style>
            body {
                font-family: "Poppins", sans-serif;
            }

            @media screen and (max-width: 767px) {
                table {
                    width: 100%;
                }
                .logo {
                    width: 90%;
                }
                .policy {
                    display: inline-block !important;
                    text-align: center;
                }
                .policy li {
                    list-style: none;
                }
                    .gs li {
                margin-left: 0 !important;
                }
                input {
                    width: 100% !important;
                }
                .logo {
                    width: 100%;
                }
                ul.policy li {
                    display: block !important;
                    width: 100% !important;
                    margin-bottom: 10px !important;
                }
                h1 {
                    font-size: 20px;
                }
                
            }
        </style>
      </head>
      <body>
    
        <table border="0" cellpadding="0" cellspacing="0" style="max-width: 800px; width: 100%; margin: 0 auto;">
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="padding: 10px 0; width: 100%;">
                        <tr>
                            <td>
                                <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                               <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/otpBanner.png" width="100%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                                <h1>Invited to Swiiftly</h1>
                                <p style="margin: 0;">Hello,</p>
                                <p style="margin: 0;"><strong>${data.full_name}</strong> you have been invited to Swiiftly by your <strong>${data.is_admin ? "Swiiftly Admin" : "Swiiftly Company"}</strong></p>
                                <p style="margin: 0;">Please use the below account details to onboard and access the ${data.user_role === "vendor" ? "vendor" : "fleet"} dashboard.</p>
    
                                <div style="margin: 30px 0;">
                                    <p style="margin: 0;">Registered Email: <strong>${data.email}</strong></p>
                                    <p style="margin: 0;">One Time Password: <strong>${data.password}</strong></p>
                                </div>
                                <p style="margin: 0 0 30px;">
                                    <a href=${data.user_role === "vendor" ? `${config.templateURL}/vendor` : `${config.templateURL}/fleet-manager`} style="text-decoration: none;">

                                    <button class="default-btn" style="border: 0; width: 155px; height: 48px; font-weight: bold; text-align: center; cursor: pointer; border-radius: 88.57px; background-color: #FDB702; color:#000;">Continue</button>
                                </a>
                                    </p>
                                <p style="margin: 0;">Best Regards,</p>
                                <p style="margin: 0;"><strong>Swiiftly team.</strong></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
             <tr>
            <td>
                <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;border-top: 1px solid rgba(217, 217, 217, 1);border-bottom: 1px solid rgba(217, 217, 217, 1);margin: 50px 0;">
                    <tr>
                        <td width="50%">
                            <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                        </td>
                       <td width="50%" align="right">
                        <ul style="padding: 0;margin: 0;">
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.instagram.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/insta.png"  width="35" height="35" alt="instagram"/>
                                </a>
                            </li>
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.facebook.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/facebook.png" width="35" height="35" alt="facebook" />
                                </a>
                            </li>
                            </ul>
</td>

                    </tr>
                </table>
            </td>
        </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td align="center">
                                <p>© 2024 SWIIFTLY. All rights reserved.</p>
                                <p>You are receiving this mail because you registered to join the SWIIFTLY platform as a user or a creator. This also shows that you agree to our Terms of use and Privacy Policies. If you no longer want to receive mails from use.</p>
                                <ul class="policy" style="padding: 0;margin: 0 auto; width: 100%;text-align: center;">
                                    <li style="list-style: none;display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;list-style: none;color: #000000;border-bottom: 1px solid #333333;">Privacy policy</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Terms of service</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Help center</a></li>
                                </ul>
                             </td>
                        </tr>
                    </table>
                </td>
            </tr>
           
        </table>
      </body>
    </html>`;
        return templateBody;
    },



    emailVerification: (data) => {
        let templateBody = `<h5>Hey ${data.name},</h5>
            <h4>Welcome to SWIIFTLY,</h4>
            <br>Click the link below to verify you email address!
            <br><a style="text-decoration:none;line-height:100%;background:#7289DA;color:white;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:15px;font-weight:normal;text-transform:none;margin:0px;" target="_blank" href='${config.BaseUrl}/api/v1/email/u/verification?type=${data.type}&token=${data.token}'>Verify Your Email</a>
            <br><p>This link will expire in 1 hour, so be sure to use it right away. Once you verify your email address, continue to log in.
            If you did not make this request, please ignore this email.</p>
            <br>Regards</br>
            <br>Team SWIIFTLY</br>`;
        return templateBody;
    },
    passwordReset: (data) => {
        let templateBody = `<h2>Hey there,</h2><br>Click the link below to change your password!
            <br><a style="text-decoration:none;line-height:100%;background:#7289DA;color:white;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:15px;font-weight:normal;text-transform:none;margin:0px;" target="_blank" href='${config.BaseUrl}/api/v1/reset/password/${data.token}'>Change Password</a>
            <br><p>This link will expire in 1 hour, so be sure to use it right away. Once you change your password, remember to log in again with your new password to continue using your account.
            If you did not make this request, please ignore this email.</p>
            <br>Regards</br>
            <br>Team SWIIFTLY</br>`;
        return templateBody;
    },
    contactUs: (data) => {
        let templateBody = `<h4>Hey Admin,</h4>you have got mail from one of your user!
            <br>from,
            <br>name:${data.name},
            <br>email:${data.email},
            <br>phone:${data.phone},
            <br>Message:<p>${data.message}</p>`;
        return templateBody;
    },
    invitationToJoinAdmin: (data) => {
        let templateBody = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">

        <title>Swiiftly</title>
    
        <style>
            body {
                font-family: "Poppins", sans-serif;
            }

            @media screen and (max-width: 767px) {
                table {
                    width: 100%;
                }
                .logo {
                    width: 90%;
                }
                .policy {
                    display: inline-block !important;
                    text-align: center;
                }
                .policy li {
                    list-style: none;
                }
                .gs li {
                    margin-left: 0 !important;
                }
                input {
                    width: 100% !important;
                }
                .logo {
                    width: 100%;
                }
                ul.policy li {
                    display: block !important;
                    width: 100% !important;
                    margin-bottom: 10px !important;
                }
                h1 {
                    font-size: 20px;
                }
            }
        </style>
      </head>
      <body>
    
        <table border="0" cellpadding="0" cellspacing="0" style="max-width: 800px; width: 100%; margin: 0 auto;">
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="padding: 10px 0; width: 100%;">
                        <tr>
                            <td>
                                <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                               <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/otpBanner.png" width="100%" alt="">
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td>
                                <h1>Invited to Join Swiiftly as ${data.is_admin ? "Admin" : "Company"}</h1>
                                <p style="margin: 0;">Hello,</p>
                                <p style="margin: 0;"><strong>${data.name}</strong>, you have been invited to join Swiiftly as an Admin by your <strong>Swiiftly Admin</strong>.</p>
                                <p style="margin: 0;">Please use the below account details to onboard and access the admin dashboard.</p>
    
                                <div style="margin: 30px 0;">
                                    <p style="margin: 0;">Registered Email: <strong>${data.email}</strong></p>
                                    <p style="margin: 0;">One Time Password: <strong>${data.password}</strong></p>
                                </div>
                                <p style="margin: 0 0 30px;">
                                    <a href=" ${config.templateURL}/admin" style="text-decoration: none;">

                                    <button class="default-btn" style="border: 0; width: 155px; height: 48px; font-weight: bold; text-align: center; cursor: pointer; border-radius: 88.57px; background-color: #FDB702; color:#000;">Continue</button>
                                </a>
                                    </p>
                                <p style="margin: 0;">Best Regards,</p>
                                <p style="margin: 0;"><strong>Swiiftly Team.</strong></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
    
             <tr>
            <td>
                <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;border-top: 1px solid rgba(217, 217, 217, 1);border-bottom: 1px solid rgba(217, 217, 217, 1);margin: 50px 0;">
                    <tr>
                        <td width="50%">
                            <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/swiiftlyLogo.png" class="logo" width="50%" alt="">
                        </td>
                       <td width="50%" align="right">
                        <ul style="padding: 0;margin: 0;">
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.instagram.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/insta.png"  width="35" height="35" alt="instagram"/>
                                </a>
                            </li>
                            <li style="list-style: none;display: inline-block;">
                                <a href="https://www.facebook.com/" style="width: 40px;height: 40px;text-decoration: none;margin-right: 10px;">
                                    <img src="https://swiftly-dev-bucket.s3.us-east-2.amazonaws.com/static/facebook.png" width="35" height="35" alt="facebook" />
                                </a>
                            </li>
                        </ul>
                    </td>
                    </tr>
                </table>
            </td>
        </tr>
    
            <tr>
                <td>
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;padding: 10px 25px;">
                        <tr>
                            <td align="center">
                                <p>© 2024 SWIIFTLY. All rights reserved.</p>
                                <p>You are receiving this mail because you registered to join the SWIIFTLY platform as a user or a creator. This also shows that you agree to our Terms of use and Privacy Policies. If you no longer want to receive mails from us.</p>
                                <ul class="policy" style="padding: 0;margin: 0 auto; width: 100%;text-align: center;">
                                    <li style="list-style: none;display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;list-style: none;color: #000000;border-bottom: 1px solid #333333;">Privacy policy</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Terms of service</a></li>
                                    <li style="display: inline-block;width: 20%;text-align: center;"><a href="#" style="text-decoration: none;color: #000000;border-bottom: 1px solid #333333;">Help center</a></li>
                                </ul>
                             </td>
                        </tr>
                    </table>
                </td>
            </tr>
           
        </table>
      </body>
    </html>`;
        return templateBody;
    },

};