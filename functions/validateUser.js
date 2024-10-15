"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME;
var ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // Ensure allowed origin from environment variables

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body); // Assuming the userId and estimateId are in the request body
        const { estimateId, userId } = body;

        if (!estimateId || !userId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                },
                body: JSON.stringify({ message: "Missing estimateId or userId." })
            };
        }

        // Query the DynamoDB table to find the estimate
        const params = {
            TableName: TABLE_NAME,
            Key: {
                estimateId: estimateId
            }
        };

        const result = await dynamoDb.get(params).promise();
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                },
                body: JSON.stringify({ message: "Estimate not found." })
            };
        }

        // Check if the userId matches
        const estimate = result.Item;
        if (estimate.servicedetails.userID === userId) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                },
                body: JSON.stringify({ message: "User authenticated successfully.", estimate: estimate })
            };
        } else {
            return {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                },
                body: JSON.stringify({ message: "UserID does not match the estimate." })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message })
        };
    }
};
