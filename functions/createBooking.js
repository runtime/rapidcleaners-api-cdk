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
        const bookingId = body.bookingId;
        const bookingDetails = body.bookingDetails;
        // const estimateId = body.bookingDetails.estimateId;
        // const locationId = body.bookingDetails.locationId;
        // const userId = body.bookingDetails.userId;
        // const name = body.bookingDetails.name || "unknown";
        // const email = body.bookingDetails.email || "unknown";
        // const phone = body.bookingDetails.phone || "unknown";
        // const location = body.bookingDetails.location || "unknown address";
        // const start = body.bookingDetails.start;
        // const end = body.bookingDetails.end;
        // const duration = body.bookingDetails.duration || 0;
        // const status = body.status || "pending";
        // const eventTitle = body.bookingDetails.eventTitle || "N/A";


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

