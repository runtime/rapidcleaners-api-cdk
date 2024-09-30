// BookingCreate Lambda function
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN; // Read allowed origin from environment variable

exports.handler = async (event) => {
    try {
        console.log("[createBooking] Received event:", JSON.stringify(event, null, 2));

        const requestBody = JSON.parse(event.body);
        console.log('[createBooking] requestBody:', requestBody);

        if (!requestBody.bookingId || !requestBody.bookingDetails) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Origin": ALLOWED_ORIGIN
                },
                body: JSON.stringify({ message: 'Invalid request: "bookingId" and "bookingDetails" are required.' }),
            };
        }
        const bookingId = requestBody.bookingId;
        const bookingDetails = requestBody.bookingDetails;
        // const estimateId = requestBody.bookingDetails.estimateId;
        // const locationId = requestBody.bookingDetails.locationId;
        // const userId = requestBody.bookingDetails.userId;
        // const name = requestBody.bookingDetails.name || "unknown";
        // const email = requestBody.bookingDetails.email || "unknown";
        // const phone = requestBody.bookingDetails.phone || "unknown";
        // const location = requestBody.bookingDetails.location || "unknown address";
        // const start = requestBody.bookingDetails.start;
        // const end = requestBody.bookingDetails.end;
        // const duration = requestBody.bookingDetails.duration || 0;
        // const status = requestBody.status || "pending";
        // const eventTitle = requestBody.bookingDetails.eventTitle || "N/A";


        const params = {
            TableName: TABLE_NAME,
            Item: {
                bookingId,
                bookingDetails,
            },
        };


        await dynamoDb.put(params).promise();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN

            },
            body: JSON.stringify({ message: 'Booking created successfully', item: params.Item }),
        };
    } catch (error) {
        console.error('Error creating booking: ', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN
            },
            body: JSON.stringify({ message: 'Error creating booking', error }),
        };
    }
};

