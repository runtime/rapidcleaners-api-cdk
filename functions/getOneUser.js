"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME; // Ensure the table name is set in the Lambda environment

exports.handler = async (event) => {
    console.log("[getOneUser] Received event:", JSON.stringify(event, null, 2));

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

        // Define the params for the DynamoDB get operation
        const params = {
            TableName: TABLE_NAME,
            Key: { userId: userId } // The userId is the partition key
        };

        // Perform the get operation from DynamoDB
        const data = await dynamoDb.get(params).promise();

        // Check if the user was found
        if (!data.Item) {
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                },
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        // Return the found user
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            body: JSON.stringify({ user: data.Item }),
        };

    } catch (error) {
        console.error("Error retrieving user:", error);
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
