"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME; // Ensure the table name for locations is set in the environment variables

exports.handler = async (event) => {
    console.log("[getOneLocation] Received event:", JSON.stringify(event, null, 2));

    try {
        const locationId = event.pathParameters.locationId; // Assuming the locationId is passed via path parameters

        // Validate the locationId
        if (!locationId || typeof locationId !== "string") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: JSON.stringify({ message: 'Invalid request: "locationId" is required and must be a string.' }),
            };
        }

        // Define the params for the DynamoDB get operation
        const params = {
            TableName: TABLE_NAME,
            Key: { locationId: locationId }
        };

        // Perform the get operation from DynamoDB
        const data = await dynamoDb.get(params).promise();

        if (!data.Item) {
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: JSON.stringify({ message: "Location not found." }),
            };
        }

        // Return the found location
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            body: JSON.stringify({ location: data.Item }),
        };

    } catch (error) {
        console.error("Error retrieving location:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
