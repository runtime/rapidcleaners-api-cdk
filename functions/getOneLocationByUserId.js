"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME; // Ensure the table name for locations is set in the environment variables

exports.handler = async (event) => {
    console.log("[getOneLocationByUserId] Received event:", JSON.stringify(event, null, 2));

    try {
        const userId = event.pathParameters.userId; // Assuming the userId is passed via path parameters

        // Validate the userId
        if (!userId || typeof userId !== "string") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: JSON.stringify({ message: 'Invalid request: "userId" is required and must be a string.' }),
            };
        }

        // Define the params for the DynamoDB query operation
        const params = {
            TableName: TABLE_NAME,
            IndexName: "userId-index", // Make sure you have a Global Secondary Index (GSI) on userId if it's not the primary key
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        };

        // Perform the query operation from DynamoDB
        const data = await dynamoDb.query(params).promise();

        if (data.Items.length === 0) {
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

        // Return the found location(s)
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            body: JSON.stringify({ locations: data.Items }),
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
