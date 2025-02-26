[33mcommit 35351b922d8343b4b1ed1c90018290a500199b0b[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m)[m
Author: VaradLakhotiya <varad.229303188@muj.manipal.edu>
Date:   Wed Feb 26 16:52:37 2025 +0530

    Move sensitive data to .env file

[1mdiff --git a/package-lock.json b/package-lock.json[m
[1mindex cb5a2d7..9a454db 100644[m
[1m--- a/package-lock.json[m
[1m+++ b/package-lock.json[m
[36m@@ -11,6 +11,7 @@[m
       "dependencies": {[m
         "body-parser": "^1.20.3",[m
         "cors": "^2.8.5",[m
[32m+[m[32m        "dotenv": "^16.4.7",[m
         "express": "^4.21.2",[m
         "mongoose": "^8.9.5",[m
         "mysql": "^2.18.1",[m
[36m@@ -297,6 +298,18 @@[m
         "npm": "1.2.8000 || >= 1.4.16"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/dotenv": {[m
[32m+[m[32m      "version": "16.4.7",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.4.7.tgz",[m
[32m+[m[32m      "integrity": "sha512-47qPchRCykZC03FhkYAhrvwU4xDBFIj1QPqaarj6mdM/hgUzfPHcpkHJOn3mJAufFeeAxAzeGsr5X0M4k6fLZQ==",[m
[32m+[m[32m      "license": "BSD-2-Clause",[m
[32m+[m[32m      "engines": {[m
[32m+[m[32m        "node": ">=12"[m
[32m+[m[32m      },[m
[32m+[m[32m      "funding": {[m
[32m+[m[32m        "url": "https://dotenvx.com"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/dunder-proto": {[m
       "version": "1.0.1",[m
       "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",[m
[1mdiff --git a/package.json b/package.json[m
[1mindex a5a0c35..b6231e5 100644[m
[1m--- a/package.json[m
[1m+++ b/package.json[m
[36m@@ -2,6 +2,7 @@[m
   "dependencies": {[m
     "body-parser": "^1.20.3",[m
     "cors": "^2.8.5",[m
[32m+[m[32m    "dotenv": "^16.4.7",[m
     "express": "^4.21.2",[m
     "mongoose": "^8.9.5",[m
     "mysql": "^2.18.1",[m
[1mdiff --git a/server.js b/server.js[m
[1mindex be01dd7..d36476b 100644[m
[1m--- a/server.js[m
[1m+++ b/server.js[m
[36m@@ -1,16 +1,17 @@[m
[32m+[m[32mrequire('dotenv').config(); // Load environment variables from .env file[m
[32m+[m
 const express = require('express');[m
 const mysql = require('mysql');[m
 const path = require('path');[m
[31m-const bodyParser = require('body-parser'); // Add this for parsing form data[m
[32m+[m[32mconst bodyParser = require('body-parser');[m
 const app = express();[m
[31m-const port = 3000;[m
 [m
[31m-// Create connection to the database[m
[32m+[m[32m// Use environment variables for database configuration[m
 const db = mysql.createConnection({[m
[31m-    host: 'localhost',[m
[31m-    user: 'root', // replace with your MySQL username[m
[31m-    password: 'Varad@2004', // replace with your MySQL password[m
[31m-    database: 'spice_symphony'[m
[32m+[m[32m    host: process.env.DB_HOST,[m
[32m+[m[32m    user: process.env.DB_USER,[m
[32m+[m[32m    password: process.env.DB_PASSWORD,[m
[32m+[m[32m    database: process.env.DB_NAME[m
 });[m
 [m
 // Connect to the database[m
[36m@@ -153,6 +154,9 @@[m [mapp.post('/api/orders', (req, res) => {[m
         res.json({ success: true, orderId: result.insertId });[m
     });[m
 });[m
[32m+[m
[32m+[m[32m// Use environment variable for port[m
[32m+[m[32mconst port = process.env.PORT || 3000; // Fallback to 3000 if PORT is not set[m
 app.listen(port, async () => {[m
     console.log(`Server started on port ${port}`);[m
 [m
[36m@@ -160,4 +164,4 @@[m [mapp.listen(port, async () => {[m
     const open = (await import('open')).default;[m
 [m
     await open(`http://localhost:${port}`);[m
[31m-});[m
[32m+[m[32m});[m
\ No newline at end of file[m
