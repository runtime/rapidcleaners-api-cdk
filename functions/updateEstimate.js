
// original
"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME;
var ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // Read allowed origin from environment variable


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
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
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
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
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
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
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
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Methods": "PUT,OPTIONS"
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};


// try to accomodate booking-completed

// "use strict";
//
// var AWS = require("aws-sdk");
// var dynamoDb = new AWS.DynamoDB.DocumentClient();
// var TABLE_NAME = process.env.TABLE_NAME;
//
// exports.handler = async (event) => {
//     console.log("[editEstimateById] Received event:", JSON.stringify(event, null, 2));
//
//     try {
//         const requestBody = JSON.parse(event.body);
//         console.log('[editEstimateById] requestBody:', requestBody);
//         console.log('[editEstimateById] requestBody.triggerEvent:', requestBody.triggerEvent);
//         //console.log('[editEstimateById] requestBody.type:', requestBody.type);
//         console.log('[editEstimateById] event.pathParameters:', event.pathParameters);
//         console.log('[editEstimateById] event.pathParameters.estimateId:', event.pathParameters.estimateId);
//
//         if (event.pathParameters && event.pathParameters.estimateId) {
//             const estimateId = event.pathParameters.estimateId;
//             console.log('[editEstimateById] estimateId:', estimateId);
//
//             // Check if it's a webhook from Cal.com
//             if (requestBody.triggerEvent === 'BOOKING_COMPLETED') {
//                 const triggerEvent = requestBody.triggerEvent;
//                 const bookingId = requestBody.payload?.bookingId; // Safely access bookingId
//                 const userEmail = requestBody.payload?.attendee?.email; // Safely access user email
//
//                 // Log bookingId and userEmail for debugging
//                 console.log('[triggerEvent] triggerEvent:', triggerEvent);
//                 console.log('[editEstimateById] bookingId:', bookingId);
//                 console.log('[editEstimateById] userEmail:', userEmail);
//
//                 // Check if bookingId is valid
//                 if (!bookingId) {
//                     console.error('Error: bookingId is missing or empty.');
//                     return {
//                         statusCode: 400,
//                         headers: {
//                             "Content-Type": "application/json",
//                             "Access-Control-Allow-Origin": "*",
//                             "Access-Control-Allow-Methods": "POST,OPTIONS"
//                         },
//                         body: JSON.stringify({ message: 'bookingId is required.' }),
//                     };
//                 }
//
//                 // Update the estimate with bookingId
//                 const params = {
//                     TableName: TABLE_NAME,
//                     Key: { estimateId: estimateId },
//                     UpdateExpression: "set bookingId = :bookingId",
//                     ExpressionAttributeValues: {
//                         ":bookingId": bookingId
//                     },
//                     ReturnValues: "UPDATED_NEW"
//                 };
//
//                 // Perform the update
//                 await dynamoDb.update(params).promise();
//                 console.log('Booking ID added to estimate!');
//
//                 return {
//                     statusCode: 200,
//                     headers: {
//                         "Content-Type": "application/json",
//                         "Access-Control-Allow-Origin": "*",
//                         "Access-Control-Allow-Methods": "PUT,POST,OPTIONS"
//                     },
//                     body: JSON.stringify({ message: "Booking ID updated successfully!" }),
//                 };
//             }
//         }
//
//         return {
//             statusCode: 400,
//             headers: {
//                 "Content-Type": "application/json",
//                 "Access-Control-Allow-Origin": "*",
//                 "Access-Control-Allow-Methods": "PUT,POST,OPTIONS"
//             },
//             body: JSON.stringify({ message: "Invalid event or missing estimateId." }),
//         };
//
//     } catch (error) {
//         console.error("Error updating estimate:", error);
//         return {
//             statusCode: 500,
//             headers: {
//                 "Content-Type": "application/json",
//                 "Access-Control-Allow-Origin": "*",
//                 "Access-Control-Allow-Methods": "PUT,OPTIONS"
//             },
//             body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
//         };
//     }
// };

// rollback code
// "use strict";
//
// var AWS = require("aws-sdk");
// var dynamoDb = new AWS.DynamoDB.DocumentClient();
// var TABLE_NAME = process.env.TABLE_NAME;
//
// exports.handler = async (event) => {
//     console.log("[updateEstimate] Received event:", JSON.stringify(event, null, 2));
//
//     try {
//         const requestBody = JSON.parse(event.body);
//         console.log('[updateEstimate] requestBody: ', requestBody);
//
//         // Validate the estimateId
//         if (!requestBody.estimateId || typeof requestBody.estimateId !== "string") {
//             return {
//                 statusCode: 400,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Access-Control-Allow-Origin": "*",
//                 },
//                 body: JSON.stringify({ message: 'Invalid request: "estimateId" is required and must be a string.' })
//             };
//         }
//
//         // Validate servicedetails
//         if (!requestBody.servicedetails || typeof requestBody.servicedetails !== "object") {
//             return {
//                 statusCode: 400,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Access-Control-Allow-Origin": "*",
//                 },
//                 body: JSON.stringify({ message: 'Invalid request: "servicedetails" is required and must be an object.' })
//             };
//         }
//
//         const params = {
//             TableName: TABLE_NAME,
//             Key: { estimateId: requestBody.estimateId },
//             UpdateExpression: "set servicedetails = :servicedetails",
//             ExpressionAttributeValues: {
//                 ":servicedetails": requestBody.servicedetails
//             },
//             ReturnValues: "UPDATED_NEW"
//         };
//
//         const data = await dynamoDb.update(params).promise();
//         console.log('[updateEstimate] Updated estimate: ', data);
//
//         // Return the updated estimate
//         return {
//             statusCode: 200,
//             headers: {
//                 "Content-Type": "application/json",
//                 "Access-Control-Allow-Origin": "*",
//             },
//             body: JSON.stringify({ message: "Estimate updated successfully!", item: data.Attributes })
//         };
//
//     } catch (error) {
//         console.error("Error updating estimate:", error);
//         return {
//             statusCode: 500,
//             headers: {
//                 "Content-Type": "application/json",
//                 "Access-Control-Allow-Origin": "*",
//             },
//             body: JSON.stringify({ message: "Internal Server Error", error: error.message })
//         };
//     }
// };
//
//

