"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log("[updateEstimate] Received event:", JSON.stringify(event, null, 2));

    try {
        const requestBody = JSON.parse(event.body);
        console.log('[updateEstimate] requestBody ', requestBody);

        // Validate the estimateId and servicedetails
        if (!requestBody.estimateId || typeof requestBody.estimateId !== "string") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "http://localhost:3000",
                    "Access-Control-Allow-Methods": "PUT,OPTIONS"
                },
                body: JSON.stringify({ message: 'Invalid request: "estimateId" is required and must be a string.' }),
            };
        }

        if (!requestBody.servicedetails || typeof requestBody.servicedetails !== "object") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "http://localhost:3000",
                    "Access-Control-Allow-Methods": "PUT,OPTIONS"
                },
                body: JSON.stringify({ message: 'Invalid request: "servicedetails" is required and must be an object.' }),
            };
        }

        // Define the params for the DynamoDB update operation
        const params = {
            TableName: TABLE_NAME,
            Key: { estimateId: requestBody.estimateId },
            UpdateExpression: "set servicedetails = :servicedetails",
            ExpressionAttributeValues: {
                ":servicedetails": requestBody.servicedetails
            },
            ReturnValues: "UPDATED_NEW"
        };

        // Perform the update operation in DynamoDB
        const data = await dynamoDb.update(params).promise();

        console.log('[updateEstimate] params ', params);
        console.log('[updateEstimate] Updated item data ', data);

        // Return the updated estimate, including the estimateId
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Methods": "PUT,OPTIONS"
            },
            body: JSON.stringify({
                message: "Estimate updated successfully!",
                item: {
                    estimateId: requestBody.estimateId,  // Always include estimateId
                    ...data.Attributes                    // Includes only updated fields (servicedeets)
                }
            }),
        };

    } catch (error) {
        console.error("Error updating estimate:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Methods": "PUT,OPTIONS"
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
