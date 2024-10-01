// BookingCreate Lambda function
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        console.log('[createBooking] body:', body);
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
            body: JSON.stringify({ message: 'Booking created successfully', item: params.Item }),
        };
    } catch (error) {
        console.error('Error creating booking: ', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating booking', error }),
        };
    }
};
