# Swiftly Backend

![Node.js Logo](https://nodejs.org/static/images/logo.svg)

## Overview

**Swiftly Backend** is a robust and advanced Node.js project designed to accelerate the development of powerful Node.js applications. This boilerplate provides comprehensive features and configurations, enabling developers to build scalable and efficient applications with ease.

## Key Features

- **File Upload with Multer**: Streamlined handling of file uploads.
- **Firebase Integration**: Seamlessly send push notifications via Firebase Cloud Messaging.
- **SMTP Integration**: Configure and send emails effortlessly.
- **Twilio Integration**: Efficiently send SMS messages using the Twilio API.
- **AWS SNS for OTPs**: Implement secure OTP generation and delivery with AWS Simple Notification Service.
- **Social Login (Google & Facebook)**: Enable hassle-free user authentication via Google and Facebook.
- **Customizable Configuration**: A flexible configuration file located in `src/config/environments/index.js` allows you to easily customize and replace keys required for your project.

## Prerequisites

Before running the project, ensure that you have the following installed:

- [Node.js](https://nodejs.org/) (version 12.x or higher)
- [npm](https://www.npmjs.com/) (Node package manager)

## Environment Configuration

It is crucial to set up your environment variables correctly to run the project. The configuration file is located at `src/config/environments/index.js`. Here, you can define essential variables such as database URLs, JWT secrets, and API keys. Make sure to customize these values according to your development or production environment.

### Example Configuration

```javascript
module.exports = {
    databaseUrl: 'your_database_url',
    BaseUrl: 'http://localhost:3001',
    jwtTokenInfo: {
        secretKey: 'your_jwt_secret_key',
        issuer: 'YourIssuer',
        audience: 'YourAudience',
        algorithm: 'HS256',
        expiresIn: '8760h'
    },
    // Additional configurations...
};
```

## Getting Started

Follow these steps to kickstart your project:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/swiftly-backend.git
   ```

2. **Navigate to the Project Directory**:
   ```bash
   cd swiftly-backend
   ```

3. **Install Project Dependencies**:
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**:
   - Create a `.env` file in the project's root directory and populate it with the necessary environment variables as defined in `src/config/environments/index.js`.

5. **Start the Development Server**:
   ```bash
   npm run start:dev
   ```

6. **Access the Application**:
   Your advanced Node.js application will be running at `http://localhost:3001`.

## Usage

Leverage the extensive set of features and the flexible configuration to build your Node.js application with ease:

- Implement file uploads using Multer.
- Utilize Firebase for efficient push notifications.
- Configure SMTP for secure email sending.
- Set up Twilio for streamlined SMS messaging.
- Implement AWS SNS for robust OTP generation and delivery.
- Enable social login with Google and Facebook for user authentication.
- Take advantage of integrated logging and MongoDB functionality.
- Customize your project by modifying the configuration in `src/config/environments/index.js`.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For any questions or support, please reach out to the project maintainers.