const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Environment variable for the table name
const TABLE_NAME = process.env.TABLE_NAME;
var ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // Read allowed origin from environment variable


exports.handler = async (event) => {
    try {
        // Set up the DynamoDB scan parameters
        const params = {
            TableName: TABLE_NAME
        };

        // Scan the DynamoDB table to get all items
        const data = await dynamoDb.scan(params).promise();

        // Return the scanned items as the response
        return {
            statusCode: 200,
            body: JSON.stringify({ estimates: data.Items }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Enable CORS
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            }
        };
    } catch (error) {
        console.error('Error retrieving estimates:', error);

        // Return an error response if something goes wrong
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN, // Enable CORS
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            }
        };
    }
};
