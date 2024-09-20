"use strict";
var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = 'rc-estimates';

exports.handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));
        const requestBody = JSON.parse(event.body);
        console.log('[createEstimate] requestBody ' , requestBody);
        // Input validation
        if (!requestBody.estimateId || typeof requestBody.estimateId !== "string") {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Origin': 'http://localhost:3000',
                },
                body: JSON.stringify({ message: 'Invalid request: "estimateId" is required and must be a string.' })
            };
        }

        if (!requestBody.servicedetails || typeof requestBody.servicedetails !== "object") {
            return {
                statusCode: 400,
                headers: {
                    // "Content-Type": "application/json",
                    // "Access-Control-Allow-Origin": "http://localhost:3000/", // Ensure CORS for error response
                    // "Access-Control-Allow-Methods": "POST,OPTIONS",
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Origin': 'http://localhost:3000',
                },
                body: JSON.stringify({ message: 'Invalid request: "servicedetails" is required and must be an object.' })
            };
        }

        // Validate the structure of servicedetails
        const requiredFields = [
            "userID",
            "typeofservice",
            "construct",
            "sqft",
            "numpeople",
            "numrooms",
            "numbaths",
            "numpets",
            "cleanfactor"
        ];

        for (const field of requiredFields) {
            if (!(field in requestBody.servicedetails)) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'POST,OPTIONS',
                        'Access-Control-Allow-Origin': 'http://localhost:3000',
                    },
                    body: JSON.stringify({ message: `Invalid request: "servicedetails.${field}" is required.` })
                };
            }
        }

        // Prepare the DynamoDB put parameters
        const params = {
            TableName: TABLE_NAME,
            Item: {
                estimateId: requestBody.estimateId,
                servicedetails: requestBody.servicedetails
            }
        };

        // Insert the item into the DynamoDB table
        await dynamoDb.put(params).promise();

        console.log('[createEstimate] params ', params);
        console.log('[createEstimate] params.Item ', params.Item);

        // Return a successful response with correct headers
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Origin': 'http://localhost:3000',
            },
            body: JSON.stringify({ message: "Estimate created successfully!", item: params.Item })
        };

    } catch (error) {
        //console.error("Error creating estimate error:", error.message);
        console.log('[createEstimate] error.message ' , error.message);


        // Return an error response with CORS headers
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Origin': 'http://localhost:3000',
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message })
        };
    }
};
