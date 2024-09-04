import * as cdk from 'aws-cdk-lib';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as api from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { join } from 'path';

export class RapidcleanersApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const estimatesTable = new dynamodb.Table(this, 'EstimatesTable', {
      partitionKey: { name: 'estimateId', type: dynamodb.AttributeType.STRING },
      tableName: 'rc-estimates',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      tableName: 'rc-users',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const locationsTable = new dynamodb.Table(this, 'LocationsTable', {
      partitionKey: { name: 'locationId', type: dynamodb.AttributeType.STRING },
      tableName: 'rc-locations',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // S3 Buckets
    const rcDataBucket = new s3.Bucket(this, 'rc-data-s3', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const rcMediaBucket = new s3.Bucket(this, 'rc-media-s3', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ['http://localhost:3000'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Define Lambda function properties
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

    // Lambda Functions for CRUD Operations on Estimates
    const getAllEstimatesLambda = new NodejsFunction(this, 'getAllEstimatesLambda', {
      entry: join(__dirname, '../functions', 'getAllEstimates.js'),
      ...nodejsFunctionProps,
    });

    const getOneEstimateLambda = new NodejsFunction(this, 'getOneEstimateLambda', {
      entry: join(__dirname, '../functions', 'getOneEstimate.js'),
      ...nodejsFunctionProps,
    });

    const createEstimateLambda = new NodejsFunction(this, 'createEstimateLambda', {
      entry: join(__dirname, '../functions', 'createEstimate.js'),
      ...nodejsFunctionProps,
    });

    const updateEstimateLambda = new NodejsFunction(this, 'updateEstimateLambda', {
      entry: join(__dirname, '../functions', 'updateEstimate.js'),
      ...nodejsFunctionProps,
    });

    const deleteEstimateLambda = new NodejsFunction(this, 'deleteEstimateLambda', {
      entry: join(__dirname, '../functions', 'deleteEstimate.js'),
      ...nodejsFunctionProps,
    });

    // Lambda Functions for CRUD Operations on Users
    const getAllUsersLambda = new NodejsFunction(this, 'getAllUsersLambda', {
      entry: join(__dirname, '../functions', 'getAllUsers.js'),
      ...nodejsFunctionProps,
    });

    const getOneUserLambda = new NodejsFunction(this, 'getOneUserLambda', {
      entry: join(__dirname, '../functions', 'getOneUser.js'),
      ...nodejsFunctionProps,
    });

    const createUserLambda = new NodejsFunction(this, 'createUserLambda', {
      entry: join(__dirname, '../functions', 'createUser.js'),
      ...nodejsFunctionProps,
    });

    const updateUserLambda = new NodejsFunction(this, 'updateUserLambda', {
      entry: join(__dirname, '../functions', 'updateUser.js'),
      ...nodejsFunctionProps,
    });

    const deleteUserLambda = new NodejsFunction(this, 'deleteUserLambda', {
      entry: join(__dirname, '../functions', 'deleteUser.js'),
      ...nodejsFunctionProps,
    });

    // Lambda Functions for CRUD Operations on Locations
    const getAllLocationsLambda = new NodejsFunction(this, 'getAllLocationsLambda', {
      entry: join(__dirname, '../functions', 'getAllLocations.js'),
      ...nodejsFunctionProps,
    });

    const getOneLocationLambda = new NodejsFunction(this, 'getOneLocationLambda', {
      entry: join(__dirname, '../functions', 'getOneLocation.js'),
      ...nodejsFunctionProps,
    });

    const createLocationLambda = new NodejsFunction(this, 'createLocationLambda', {
      entry: join(__dirname, '../functions', 'createLocation.js'),
      ...nodejsFunctionProps,
    });

    const updateLocationLambda = new NodejsFunction(this, 'updateLocationLambda', {
      entry: join(__dirname, '../functions', 'updateLocation.js'),
      ...nodejsFunctionProps,
    });

    const deleteLocationLambda = new NodejsFunction(this, 'deleteLocationLambda', {
      entry: join(__dirname, '../functions', 'deleteLocation.js'),
      ...nodejsFunctionProps,
    });

    // Grant DynamoDB permissions to Lambda functions
    estimatesTable.grantReadWriteData(getAllEstimatesLambda);
    estimatesTable.grantReadWriteData(getOneEstimateLambda);
    estimatesTable.grantReadWriteData(createEstimateLambda);
    estimatesTable.grantReadWriteData(updateEstimateLambda);
    estimatesTable.grantReadWriteData(deleteEstimateLambda);

    usersTable.grantReadWriteData(getAllUsersLambda);
    usersTable.grantReadWriteData(getOneUserLambda);
    usersTable.grantReadWriteData(createUserLambda);
    usersTable.grantReadWriteData(updateUserLambda);
    usersTable.grantReadWriteData(deleteUserLambda);

    locationsTable.grantReadWriteData(getAllLocationsLambda);
    locationsTable.grantReadWriteData(getOneLocationLambda);
    locationsTable.grantReadWriteData(createLocationLambda);
    locationsTable.grantReadWriteData(updateLocationLambda);
    locationsTable.grantReadWriteData(deleteLocationLambda);

    // API Gateway Setup
    const rapidcleanAPI = new api.RestApi(this, 'RapidCleanAPI', {
      restApiName: 'rc-service',
      description: 'AWS CDK IaC for API Gateway with Lambda Proxy integration',
      deployOptions: { stageName: 'prod' },
    });

    // API Gateway Resources and Methods for Estimates
    const estimates = rapidcleanAPI.root.addResource('estimates');
    estimates.addMethod('GET', new api.LambdaIntegration(getAllEstimatesLambda));
    estimates.addMethod('POST', new api.LambdaIntegration(createEstimateLambda));
    addCorsOptions(estimates);

    const singleEstimate = estimates.addResource('{estimateId}');
    singleEstimate.addMethod('GET', new api.LambdaIntegration(getOneEstimateLambda));
    singleEstimate.addMethod('PUT', new api.LambdaIntegration(updateEstimateLambda));
    singleEstimate.addMethod('DELETE', new api.LambdaIntegration(deleteEstimateLambda));
    addCorsOptions(singleEstimate);

    // API Gateway Resources and Methods for Users
    const users = rapidcleanAPI.root.addResource('users');
    users.addMethod('GET', new api.LambdaIntegration(getAllUsersLambda));
    users.addMethod('POST', new api.LambdaIntegration(createUserLambda));
    addCorsOptions(users);

    const singleUser = users.addResource('{userId}');
    singleUser.addMethod('GET', new api.LambdaIntegration(getOneUserLambda));
    singleUser.addMethod('PUT', new api.LambdaIntegration(updateUserLambda));
    singleUser.addMethod('DELETE', new api.LambdaIntegration(deleteUserLambda));
    addCorsOptions(singleUser);

    // API Gateway Resources and Methods for Locations
    const locations = rapidcleanAPI.root.addResource('locations');
    locations.addMethod('GET', new api.LambdaIntegration(getAllLocationsLambda));
    locations.addMethod('POST', new api.LambdaIntegration(createLocationLambda));
    addCorsOptions(locations);

    const singleLocation = locations.addResource('{locationId}');
    singleLocation.addMethod('GET', new api.LambdaIntegration(getOneLocationLambda));
    singleLocation.addMethod('PUT', new api.LambdaIntegration(updateLocationLambda));
    singleLocation.addMethod('DELETE', new api.LambdaIntegration(deleteLocationLambda));
    addCorsOptions(singleLocation);

    // Enable CloudWatch Logs and Metrics for Lambda functions
    new cloudwatch.LogGroup(this, 'EstimatesLambdaLogs', {
      logGroupName: `/aws/lambda/${getAllEstimatesLambda.functionName}`,
      retention: cloudwatch.RetentionDays.ONE_WEEK,
    });

    new cloudwatch.LogGroup(this, 'UsersLambdaLogs', {
      logGroupName: `/aws/lambda/${getAllUsersLambda.functionName}`,
      retention: cloudwatch.RetentionDays.ONE_WEEK,
    });

    new cloudwatch.LogGroup(this, 'LocationsLambdaLogs', {
      logGroupName: `/aws/lambda/${getAllLocationsLambda.functionName}`,
      retention: cloudwatch.RetentionDays.ONE_WEEK,
    });

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: rapidcleanAPI.url ?? 'Something went wrong with the deploy',
    });
  }
}

// CORS configuration function
export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: { "application/json": "{\"statusCode\": 200}" },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }],
  });
}


