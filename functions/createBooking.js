// functions/createBooking.js

"use strict";

var AWS = require("aws-sdk");
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log("[createBooking] Received event:", JSON.stringify(event, null, 2));

    try {
        const requestBody = JSON.parse(event.body);
        const { payload } = requestBody;
        console.log("[createBooking] payload:", payload);

        // Create a new booking entry with additional fields for address and duration
        const bookingEntry = {
            bookingId: String(payload.bookingId), // Ensure bookingId is stored as a string
            userEmail: payload.attendees[0].email,
            startTime: String(payload.startTime),
            endTime: String(payload.endTime),
            duration: payload.length, // Convert duration to string as well
            address: String(payload.location) || "unknown address",
            status: payload.status,
            eventTitle: String(payload.eventTitle),
            estimateId: null // Initially null until the estimate is linked
        };


        const params = {
            TableName: TABLE_NAME,
            Item: bookingEntry
        };

        await dynamoDb.put(params).promise();
        console.log("Booking entry created:", bookingEntry);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            body: JSON.stringify({ message: "Booking created successfully!", bookingEntry }),
        };

    } catch (error) {
        console.error("Error creating booking:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
