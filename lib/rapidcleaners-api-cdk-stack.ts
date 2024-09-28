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
import * as iam from 'aws-cdk-lib/aws-iam';
import { join } from 'path';

export class RapidcleanersApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = process.env.NODE_ENV || 'stage'; // 'dev', 'stage', 'prod'

    // Correct structure for allowedOrigins
    const allowedOriginsMap: { [key: string]: string[] } = {
      dev: ['http://localhost:3000'],
      stage: ['http://rapidcleanstage.s3-website-us-east-1.amazonaws.com'],
      prod: ['http://rapidcleanprod.s3-website-us-east-1.amazonaws.com'],
    };

    const currentAllowedOrigins = allowedOriginsMap[environment] || ['*'];

    // DynamoDB Tables
    const estimatesTable = new dynamodb.Table(this, `EstimatesTable-${environment}`, {
      partitionKey: { name: 'estimateId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-estimates-${environment}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const usersTable = new dynamodb.Table(this, `UsersTable-${environment}`, {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-users-${environment}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const locationsTable = new dynamodb.Table(this, `LocationsTable-${environment}}`, {
      partitionKey: { name: 'locationId', type: dynamodb.AttributeType.STRING },
      tableName: `rc-locations-${environment}`,
      removalPolicy: RemovalPolicy.DESTROY,
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
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // S3 Buckets
    const rcDataBucket = new s3.Bucket(this, `rc-data-s3-${environment}`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const rcMediaBucket = new s3.Bucket(this, `rc-media-s3-${environment}`, {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
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
        NODE_ENV: environment,
      },
    });

    // Add the rest of the Lambda functions following a similar pattern...

    // API Gateway Setup
    const rapidcleanAPI = new api.RestApi(this, `RapidCleanAPI-${environment}`, {
      restApiName: `rc-service-${environment}`,
      description: 'AWS API Gateway with Lambda Proxy integration',
      deployOptions: { stageName: 'prod' },
    });

    // Add CORS Options and Lambda integrations to the API resources
    const bookings = rapidcleanAPI.root.addResource('bookings');
    bookings.addMethod('POST', new api.LambdaIntegration(createEstimateLambda));
    addCorsOptions(bookings);

    const estimates = rapidcleanAPI.root.addResource('estimates');
    estimates.addMethod('POST', new api.LambdaIntegration(createEstimateLambda));
    addCorsOptions(estimates);

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
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,OPTIONS'",
        'method.response.header.Access-Control-Allow-Origin': "`${allowedOrigins.join(', ')}`",  // Change according to environment
        'method.response.header.Access-Control-Max-Age': "'600'",
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
