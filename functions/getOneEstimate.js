"use strict";
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME; // Ensure the table name is set in the environment variables
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // Read allowed origin from environment variable

exports.handler = async (event) => {
    const estimateId = event.pathParameters.estimateId; // Extract EstimateId from the request path

    try {
        console.log(`[getOneEstimate] estimateId: ${estimateId}`);

        // Validate if estimateId is provided
        if (!estimateId) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'GET,OPTIONS',
                },
                body: JSON.stringify({ message: '"estimateId" is required' }),
            };
        }

        // Define the parameters to query DynamoDB
        const params = {
            TableName: TABLE_NAME,
            Key: { estimateId },
        };

        // Get the estimate from DynamoDB
        const result = await dynamoDb.get(params).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {

                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                    'Access-Control-Allow-Methods': 'GET,OPTIONS',
                },
                body: JSON.stringify({ message: 'Estimate not found' }),
            };
        }

        // Return the retrieved estimate
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            body: JSON.stringify(result.Item),
        };

    } catch (error) {
        console.error(`[getOneEstimate] Error retrieving estimate: ${error.message}`);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
            },
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
        };
    }
};
