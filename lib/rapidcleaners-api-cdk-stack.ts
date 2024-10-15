import * as cdk from 'aws-cdk-lib';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as api from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { join } from 'path';

export class RapidcleanersApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {


    // Define the environment - can be 'dev', 'stage', or 'prod'
    let environment = 'dev'; // Adjust this manually as needed
    console.log('RapidEnvironment:', environment)

    const stackName = `RapidCleanAPI-${environment}`;

    super(scope, stackName, { ...props, stackName });

    // Correct structure for allowedOrigins
    const allowedOriginsMap: { [key: string]: string[] } = {
      dev: ['http://localhost:3000'],
      stage: ['https://stage.rapidclean.ninja'],
      prod: ['https://rapidclean.ninja'],
    };

    // Get allowed origins based on the environment
    const currentAllowedOrigins = allowedOriginsMap[environment] || ['*'];

    // Use RemovalPolicy.RETAIN for production and DESTROY for other environments
    const removalPolicy =
        environment === 'prod' || environment ==='stage' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;


    // DynamoDB Tables
    const estimatesTable = new dynamodb.Table(this, `EstimatesTable-${environment}`, {
      partitionKey: { name: 'estimateId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-estimates-${environment}`,
      removalPolicy: removalPolicy,
    });

    const usersTable = new dynamodb.Table(this, `UsersTable-${environment}`, {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-users-${environment}`,
      removalPolicy: removalPolicy,
    });

    const locationsTable = new dynamodb.Table(this, `LocationsTable-${environment}}`, {
      partitionKey: { name: 'locationId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-locations-${environment}`,
      removalPolicy: removalPolicy,
    });

    // GSI for Locations Table
    locationsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const bookingsTable = new dynamodb.Table(this, `RcBookingsTable-${environment}`, {
      partitionKey: { name: 'bookingId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-bookings-${environment}`,
      removalPolicy: removalPolicy,
    });

    // S3 Buckets
    const rcDataBucket = new s3.Bucket(this, `rc-data-s3-${environment}`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const rcMediaBucket = new s3.Bucket(this, `rc-media-s3-${environment}`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      cors: [
        {
          allowedOrigins: currentAllowedOrigins, // Use the current environment's allowed origins
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Backup role and permissions
    const dynamoBackupRole = new iam.Role(this, 'DynamoBackupRole', {
      assumedBy: new iam.ServicePrincipal('dynamodb.amazonaws.com'),
    });

    rcDataBucket.grantReadWrite(dynamoBackupRole);
    estimatesTable.grantFullAccess(dynamoBackupRole);
    usersTable.grantFullAccess(dynamoBackupRole);
    locationsTable.grantFullAccess(dynamoBackupRole);
    bookingsTable.grantFullAccess(dynamoBackupRole);

    // Lambda function properties
    const nodejsFunctionProps: NodejsFunctionProps = {
      bundling: { externalModules: ['aws-sdk'] },
      depsLockFilePath: join(__dirname, '../package-lock.json'),
      environment: {
        ESTIMATES_TABLE_NAME: estimatesTable.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
        LOCATIONS_TABLE_NAME: locationsTable.tableName,
        BUCKET_NAME: rcMediaBucket.bucketName,
      },
      runtime: Runtime.NODEJS_16_X,
    };

    // Lambda for Estimates
    const createEstimateLambda = new NodejsFunction(this, `createEstimateLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'createEstimate.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: estimatesTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,
      },
    });

    const updateEstimateLambda = new NodejsFunction(this, `updateEstimateLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'updateEstimate.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: estimatesTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,
      },
    });

    const getAllEstimatesLambda = new NodejsFunction(this, `getAllEstimatesLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getAllEstimates.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: estimatesTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment, // Ensure this is correct
      },
    });

    const getOneEstimateLambda = new NodejsFunction(this, `getOneEstimateLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getOneEstimate.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: estimatesTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment, // Ensure this is correct
      },
    });


    const deleteEstimateLambda = new NodejsFunction(this, `deleteEstimateLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'deleteEstimate.js'),
      ...nodejsFunctionProps,
    });

    // Lambda Functions for CRUD Operations on Users
    const getAllUsersLambda = new NodejsFunction(this, `getAllUsersLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getAllUsers.js'),
      ...nodejsFunctionProps,
    });

    const getOneUserLambda = new NodejsFunction(this, `getOneUserLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getOneUser.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: usersTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });

    const createUserLambda = new NodejsFunction(this, `createUserLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'createUser.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: usersTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });

    const updateUserLambda = new NodejsFunction(this, `updateUserLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'updateUser.js'),
      ...nodejsFunctionProps,
    });

    const deleteUserLambda = new NodejsFunction(this, `deleteUserLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'deleteUser.js'),
      ...nodejsFunctionProps,
    });

    // Inside the constructor

// Temporary Validation -  Lambda function for userId -> EstimateId validation
    const validateUserLambda = new NodejsFunction(this, `validateUserLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'validateUser.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: estimatesTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,
      },
    });






    // Lambda Functions for CRUD Operations on Locations
    const getAllLocationsLambda = new NodejsFunction(this, `getAllLocationsLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getAllLocations.js'),
      ...nodejsFunctionProps,
    });

    const getOneLocationLambda = new NodejsFunction(this, `getOneLocationLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getOneLocation.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: locationsTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });

    const getOneLocationByUserId = new NodejsFunction(this, `getOneLocationByUserIdLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getOneLocationByUserId.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: locationsTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });

    const createLocationLambda = new NodejsFunction(this, `createLocationLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'createLocation.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: locationsTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });


    const updateLocationLambda = new NodejsFunction(this, `updateLocationLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'updateLocation.js'),
      ...nodejsFunctionProps,
    });

    const deleteLocationLambda = new NodejsFunction(this, `deleteLocationLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'deleteLocation.js'),
      ...nodejsFunctionProps,
    });

    const createBookingLambda = new NodejsFunction(this, `createBookingLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'createBooking.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: bookingsTable.tableName,
        NODE_ENV: environment,// Ensure this is correct
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
      },
    });

    const getAllBookingsLambda = new NodejsFunction(this, `getAllBookingsLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'getAllBookings.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: bookingsTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });

    const updateBookingLambda = new NodejsFunction(this, `updateBookingLambda-${environment}`, {
      entry: join(__dirname, '../functions', 'updateBooking.js'),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
      environment: {
        TABLE_NAME: bookingsTable.tableName,
        ALLOWED_ORIGIN: currentAllowedOrigins[0],
        NODE_ENV: environment,// Ensure this is correct
      },
    });

    // Grant DynamoDB permissions to Lambda functions
    estimatesTable.grantReadWriteData(getAllEstimatesLambda);
    estimatesTable.grantReadWriteData(getOneEstimateLambda);
    estimatesTable.grantReadWriteData(createEstimateLambda);
    estimatesTable.grantReadWriteData(updateEstimateLambda);
    estimatesTable.grantReadWriteData(deleteEstimateLambda);
    estimatesTable.grantReadData(validateUserLambda);

    usersTable.grantReadWriteData(getAllUsersLambda);
    usersTable.grantReadWriteData(getOneUserLambda);
    usersTable.grantReadWriteData(createUserLambda);
    usersTable.grantReadWriteData(updateUserLambda);
    usersTable.grantReadWriteData(deleteUserLambda);

    locationsTable.grantReadWriteData(getAllLocationsLambda);
    locationsTable.grantReadWriteData(getOneLocationLambda);
    locationsTable.grantReadWriteData(getOneLocationByUserId);
    locationsTable.grantReadWriteData(createLocationLambda);
    locationsTable.grantReadWriteData(updateLocationLambda);
    locationsTable.grantReadWriteData(deleteLocationLambda);

    bookingsTable.grantReadWriteData(createBookingLambda);
    //bookingsTable.grantReadWriteData(updateBookingLambda);
    //bookingsTable.grantReadWriteData(getAllBookingsLambda);


    // API Gateway Setup
    const rapidcleanAPI = new api.RestApi(this, `RapidCleanAPI-${environment}`, {
      restApiName: `rc-service-${environment}`,
      description: 'AWS API Gateway with Lambda Proxy integration',
      deployOptions: { stageName: environment }, // Adjust this based on environment
    });

    // added this from experience
    addCorsOptions(rapidcleanAPI.root, currentAllowedOrigins);

    //validation root
    // API Gateway Resource for Estimate User Validation
    const validation = rapidcleanAPI.root.addResource('validate');
    validation.addMethod('POST', new api.LambdaIntegration(validateUserLambda));
    addCorsOptions(validation, currentAllowedOrigins);

    //Bookings root
    const bookings = rapidcleanAPI.root.addResource('bookings');
    bookings.addMethod('POST', new api.LambdaIntegration(createBookingLambda));
    addCorsOptions(bookings, currentAllowedOrigins);

    const estimates = rapidcleanAPI.root.addResource('estimates');
    estimates.addMethod('POST', new api.LambdaIntegration(createEstimateLambda));
    //bookings.addMethod('GET', new api.LambdaIntegration(getAllBookingsLambda));
    addCorsOptions(estimates, currentAllowedOrigins);


    const singleEstimate = estimates.addResource('{estimateId}');
    singleEstimate.addMethod('GET', new api.LambdaIntegration(getOneEstimateLambda));
    singleEstimate.addMethod('PUT', new api.LambdaIntegration(updateEstimateLambda));
    singleEstimate.addMethod('DELETE', new api.LambdaIntegration(deleteEstimateLambda));
    addCorsOptions(singleEstimate, currentAllowedOrigins);

    // API Gateway Resources and Methods for Users
    const users = rapidcleanAPI.root.addResource('users');
    users.addMethod('GET', new api.LambdaIntegration(getAllUsersLambda));
    users.addMethod('POST', new api.LambdaIntegration(createUserLambda));
    addCorsOptions(users, currentAllowedOrigins);

    const singleUser = users.addResource('{userId}');
    singleUser.addMethod('GET', new api.LambdaIntegration(getOneUserLambda));
    singleUser.addMethod('PUT', new api.LambdaIntegration(updateUserLambda));
    singleUser.addMethod('DELETE', new api.LambdaIntegration(deleteUserLambda));
    addCorsOptions(singleUser, currentAllowedOrigins);


    // API Gateway Resources and Methods for Locations
    const locations = rapidcleanAPI.root.addResource('locations');
    locations.addMethod('GET', new api.LambdaIntegration(getAllLocationsLambda));
    locations.addMethod('POST', new api.LambdaIntegration(createLocationLambda));
    addCorsOptions(locations, currentAllowedOrigins);

    const singleLocation = locations.addResource('{locationId}');
    singleLocation.addMethod('GET', new api.LambdaIntegration(getOneLocationLambda));
    singleLocation.addMethod('PUT', new api.LambdaIntegration(updateLocationLambda));
    singleLocation.addMethod('DELETE', new api.LambdaIntegration(deleteLocationLambda));
    addCorsOptions(singleLocation, currentAllowedOrigins);

    const locationByUser = locations.addResource('user').addResource('{userId}');
    locationByUser.addMethod('GET', new api.LambdaIntegration(getOneLocationByUserId)); // Get one location by userId
    addCorsOptions(locationByUser, currentAllowedOrigins);



    // Output API Gateway URL
    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: rapidcleanAPI.url ?? 'Something went wrong with the deploy',
    });
  }
}

// CORS configuration function
export function addCorsOptions(apiResource: IResource, allowedOrigins: string[]) {
  const origin = allowedOrigins.join(', '); // Join allowed origins into a string

  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,OPTIONS'",
        'method.response.header.Access-Control-Allow-Origin': `'${origin}'`,  // Properly wrap in quotes
        'method.response.header.Access-Control-Max-Age': "'600'", // Disable CORS caching for testing
      },
    }],
    passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Max-Age': true,
      },
    }],
  });
}
