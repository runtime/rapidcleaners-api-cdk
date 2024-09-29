"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME; // Make sure to set this table name in the environment variables
var ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // Read allowed origin from environment variable

exports.handler = async (event) => {
    console.log("[createUser] Received event:", JSON.stringify(event, null, 2));

    try {
        const requestBody = JSON.parse(event.body);
        console.log('[createUser] requestBody:', requestBody);

        // Validate userId and user details
        if (!requestBody.userId || typeof requestBody.userId !== "string") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN

                },
                body: JSON.stringify({ message: 'Invalid request: "userId" is required and must be a string.' }),
            };
        }

        if (!requestBody.userDetails || typeof requestBody.userDetails !== "object") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN

                },
                body: JSON.stringify({ message: 'Invalid request: "userDetails" is required and must be an object.' }),
            };
        }

        // Define required fields in userDetails
        const requiredFields = ["email", "firstname", "lastname", "phone"];
        for (const field of requiredFields) {
            if (!(field in requestBody.userDetails)) {
                return {
                    statusCode: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Methods": "POST,OPTIONS",
                        "Access-Control-Allow-Origin": ALLOWED_ORIGIN


                    },
                    body: JSON.stringify({ message: `Invalid request: "userDetails.${field}" is required.` }),
                };
            }
        }

        // Define the params for the DynamoDB put operation
        const params = {
            TableName: TABLE_NAME,
            Item: {
                userId: requestBody.userId, // Store userId
                userDetails: requestBody.userDetails, // Store user details
            }
        };

        // Perform the put operation in DynamoDB
        await dynamoDb.put(params).promise();

        console.log('[createUser] params:', params);

        // Return a successful response
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "User created successfully!", item: params.Item }),
        };

    } catch (error) {
        console.error("Error creating user:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
