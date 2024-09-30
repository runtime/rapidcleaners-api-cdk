"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME; // Ensure the table name for locations is set in the environment variables

exports.handler = async (event) => {
    console.log("[createLocation] Received event:", JSON.stringify(event, null, 2));

    try {
        const requestBody = JSON.parse(event.body);
        console.log('[createLocation] requestBody: ', requestBody);

        // Validate the location details
        if (!requestBody.locationdetails || typeof requestBody.locationdetails !== "object") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS"
                },
                body: JSON.stringify({ message: '"locationdetails" is required and must be an object.' }),
            };
        }

        const locationId = requestBody.locationId;
        if (!locationId || typeof locationId !== "string") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS"
                },
                body: JSON.stringify({ message: '"locationId" is required and must be a string.' }),
            };
        }

        // Define the params for the DynamoDB put operation
        const params = {
            TableName: TABLE_NAME,
            Item: {
                locationId: locationId,
                locationdetails: requestBody.locationdetails
            }
        };

        // Perform the put operation in DynamoDB
        await dynamoDb.put(params).promise();
        console.log('[createLocation] params: ', params);

        // Return a successful response
        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "Location created successfully!", item: params.Item }),
        };

    } catch (error) {
        console.error("Error creating location:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
