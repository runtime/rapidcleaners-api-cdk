"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME;
var ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        console.log('[validateUser] event.body:', event.body);

        const { estimateId, userId } = body;

        console.log('[validateUser] estimateId from event.body:', estimateId);
        console.log('[validateUser] userId from event.body:', userId);

        // Validate input
        if (!estimateId) {
            console.log('[validateUser] Missing estimateId')
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                },
                body: JSON.stringify({ message: "Missing estimateId." })
            };
        }

        // Query the estimate by estimateId
        const params = {
            TableName: TABLE_NAME,
            Key: {
                estimateId: estimateId, // Query by estimateId only
            }
        };

        const result = await dynamoDb.get(params).promise();

        console.log('[validateUser] result:', result);
        console.log('[validateUser] result.Item:', result.Item);
        console.log('[validateUser] result.Item.servicedetails:', result.Item.servicedetails);


        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                },
                body: JSON.stringify({ message: "Estimate not found." })
            };
        }

        const estimate = result.Item;

        console.log('[validateUser] estimate.servicedetails.userID:', estimate.servicedetails.userID);

        // Compare userId from the request with userID in the estimate's servicedetails
        if (estimate.servicedetails.userID === userId) {
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                },
                body: JSON.stringify({ message: "User authenticated successfully.", estimate: estimate })
            };
        } else {
            return {
                statusCode: 403,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                },
                body: JSON.stringify({ message: "UserID does not match the estimate." })
            };
        }

    } catch (error) {
        console.error('[validateUser] error:', error.message);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message })
        };
    }
};
