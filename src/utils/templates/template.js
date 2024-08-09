'use strict';
const config = require('../../config/environments');
module.exports = {
    otpVerification: (data) => {
        let templateBody = `<!DOCTYPE html>
                <html lang="en">
                <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width,initial-scale=1">
                      <meta name="x-apple-disable-message-reformatting" >
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
                      <title>Email Template - Activation Code</title>
                      
                
                    <style>
                        @media only screen and (max-width: 992px) {
                            table {
                                padding: 20px;
                                max-width: 768px !important;
                                width: 768px !important;
                            }
                            .logo {
                                width: 200px !important;
                            }
                        }
                        @media only screen and (max-width: 768px) {
                            table {
                                padding: 20px;
                                max-width: 100% !important;
                                width: 100% !important;
                            }
                        }
                        @media only screen and (max-width: 767px) {
                            img {
                                width: 150px;
                            }
                            p {
                                font-size: 18px;
                                width: 100% !important;
                            }
                            ul {
                                margin-top: 25px !important;
                            }
                            ul li a img {
                                width: 40px;
                                height: 40px;
                            }
                            .otp {
                                margin: 25px 0 !important;
                                width: 85% !important;
                            }
                            ul li {
                                margin: 0 5px !important;
                            }
                            .right-check {
                                width: 100px !important;
                            }
                            .logo {
                                margin-bottom: 10px !important;
                            }
                        }
                    </style>
                </head>
                      <body style="margin:0; padding:0; font-family: 'Montserrat', sans-serif;font-weight: 400;font-size: 16px;background-color: #F2F2F2;">
                            <table width="1000" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;max-width: 800px;padding: 20px;">
                            <tr style="background-color: #ffffff;">
                                <td width="100%" align="center" style="padding: 20px;">
                                    <img src="https://dev-wxlfdigital.s3.amazonaws.com/static/shield.png" class="right-check" width="150" alt="">
                                    <p style="width: 75%;margin: 0 auto;font-size: 18px;line-height: 30px;">We appreciate your selection of SWIIFTLY. Please utilize the provided OTP to complete your Sign Up process.</p>
                                    <div class="otp" style="display: flex;align-items: center;justify-content: center;background-color: rgba(205, 246, 244, 1);width: 60%;padding: 20px;margin: 20px 0 40px;">
                                        <span style="color: #37303F;font-weight: 600;font-size: 24px;letter-spacing: 0.4em;">${data.otp}</span>
                                    </div>
                                    <p style="font-weight: 400;font-size: 21px;margin-bottom: 0;">Regards,</p>
                                    <p style="font-weight: 600;font-size: 21px;margin-top: 10px">Team SWIIFTLY</p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center">
                                   
                                    <p style="font-weight: 400;font-size: 21px;">Copyright © 2024 | SWIIFTLY</p>
                                    
                                </td>
                            </tr>
                        </table>
                      </body>
                </html>
                  
                </body>
                </html>
                `;
        return templateBody;
    },
    ResetOtpVerification: (data) => {
        let templateBody = `<!DOCTYPE html>
        <html lang="en">
        <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <meta name="x-apple-disable-message-reformatting" >
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
              <title>Email Template - Activation Code</title>
              
        
            <style>
                @media only screen and (max-width: 992px) {
                    table {
                        padding: 20px;
                        max-width: 768px !important;
                        width: 768px !important;
                    }
                    .logo {
                        width: 200px !important;
                    }
                }
                @media only screen and (max-width: 768px) {
                    table {
                        padding: 20px;
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                }
                @media only screen and (max-width: 767px) {
                    img {
                        width: 150px;
                    }
                    p {
                        font-size: 18px;
                        width: 100% !important;
                    }
                    ul {
                        margin-top: 25px !important;
                    }
                    ul li a img {
                        width: 40px;
                        height: 40px;
                    }
                    .otp {
                        margin: 25px 0 !important;
                        width: 85% !important;
                    }
                    ul li {
                        margin: 0 5px !important;
                    }
                    .right-check {
                        width: 100px !important;
                    }
                    .logo {
                        margin-bottom: 10px !important;
                    }
                }
            </style>
        </head>
              <body style="margin:0; padding:0; font-family: 'Montserrat', sans-serif;font-weight: 400;font-size: 16px;background-color: #F2F2F2;">
                    <table width="1000" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;max-width: 800px;padding: 20px;">
                    <tr style="background-color: #ffffff;">
                        <td width="100%" align="center" style="padding: 20px;">
                            <img src="https://dev-wxlfdigital.s3.amazonaws.com/static/shield.png" class="right-check" width="150" alt="">
                            <p style="width: 75%;margin: 0 auto;font-size: 18px;line-height: 30px;">We appreciate your selection of SWIIFTLY. Please utilize the provided OTP to complete your Reset-Password process.</p>
                            <div class="otp" style="display: flex;align-items: center;justify-content: center;background-color: rgba(205, 246, 244, 1);width: 60%;padding: 20px;margin: 20px 0 40px;">
                                <span style="color: #37303F;font-weight: 600;font-size: 24px;letter-spacing: 0.4em;">${data.otp}</span>
                            </div>
                            <p style="font-weight: 400;font-size: 21px;margin-bottom: 0;">Regards,</p>
                            <p style="font-weight: 600;font-size: 21px;margin-top: 10px">Team SWIIFTLY</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                           
                            <p style="font-weight: 400;font-size: 21px;">Copyright © 2024 | SWIIFTLY</p>
                            
                        </td>
                    </tr>
                </table>
              </body>
        </html>
          
        </body>
        </html>
        `;
        return templateBody;
    },
    invitationToJoinSWIIFTLY: (data) => {
        let templateBody = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <meta name="x-apple-disable-message-reformatting">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
                <title>Invitation to Join SWIIFTLY</title>
                <style>
                    @media only screen and (max-width: 992px) {
                        table {
                            padding: 20px;
                            max-width: 768px !important;
                            width: 768px !important;
                        }
                        .logo {
                            width: 200px !important;
                        }
                    }
                    @media only screen and (max-width: 768px) {
                        table {
                            padding: 20px;
                            max-width: 100% !important;
                            width: 100% !important;
                        }
                    }
                    @media only screen and (max-width: 767px) {
                        img {
                            width: 150px;
                        }
                        p {
                            font-size: 18px;
                            width: 100% !important;
                        }
                        ul {
                            margin-top: 25px !important;
                        }
                        ul li a img {
                            width: 40px;
                            height: 40px;
                        }
                        .otp {
                            margin: 25px 0 !important;
                            width: 85% !important;
                        }
                        ul li {
                            margin: 0 5px !important;
                        }
                        .right-check {
                            width: 100px !important;
                        }
                        .logo {
                            margin-bottom: 10px !important;
                        }
                    }
                </style>
            </head>
            <body style="margin:0; padding:0; font-family: 'Montserrat', sans-serif;font-weight: 400;font-size: 16px;background-color: #F2F2F2;">
                <table width="1000" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;max-width: 800px;padding: 20px;">
                    <tr style="background-color: #ffffff;">
                        <td width="100%" align="center" style="padding: 20px;">
                            <img src="https://dev-wxlfdigital.s3.amazonaws.com/static/shield.png" class="right-check" width="150" alt="">
                            <p style="width: 75%;margin: 0 auto;font-size: 18px;line-height: 30px;">We are excited to invite you to join SWIIFTLY. Below are your account details:</p>
                            <div style="background-color: rgba(205, 246, 244, 1);width: 60%;padding: 20px;margin: 20px 0;">
                                <p style="color: #37303F;font-weight: 600;font-size: 20px;">Name: ${data.full_name}</p>
                                <p style="color: #37303F;font-weight: 600;font-size: 20px;">Email: ${data.email}</p>
                                <p style="color: #37303F;font-weight: 600;font-size: 20px;">Password: ${data.password}</p>
                            </div>
                            <p style="font-weight: 400;font-size: 21px;margin-bottom: 0;">Regards,</p>
                            <p style="font-weight: 600;font-size: 21px;margin-top: 10px">Team SWIIFTLY</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                            <p style="font-weight: 400;font-size: 21px;">Copyright © 2024 | SWIIFTLY</p>
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

};