import * as cdk from 'aws-cdk-lib';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as api from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import {join} from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class RapidcleanersApiCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // rapidclean resource
    const rapidCleanDB = new dynamodb.Table(this, 'estimates', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'rapidclean-estimates',
      removalPolicy: RemovalPolicy.RETAIN, // change for production to preserve db
    });

    const nodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk',
        ],
      },
      depsLockFilePath: join(__dirname, '../package-lock.json'),
      environment: {
        PRIMARY_KEY: 'itemId',
        TABLE_NAME: rapidCleanDB.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    }
    // create a lambda function that access the dynamodb table above and has permissions to read, write, update and delete
    const lambdaRCFunction = new NodejsFunction(this, 'handler', {
      entry: join(__dirname, '../functions', 'lambdaHandler.js'),
      ...nodejsFunctionProps,
    });

    // attach read write policy
    // one handler
    rapidCleanDB.grantReadWriteData(lambdaRCFunction);

    // add more lambdas to decouple tasks
    // rapidCleanDB.grantReadWriteData(getOneLambda);
    // rapidCleanDB.grantReadWriteData(createOneLambda);
    // rapidCleanDB.grantReadWriteData(updateOneLambda);
    // rapidCleanDB.grantReadWriteData(deleteOneLambda);

    // integrate lambda functions with the api gateway resource
    const lambdaFunctionIntegration = new api.LambdaIntegration(lambdaRCFunction);

    // create an api gateway that uses the lambda handler above as a method to GET and GET by itemId
    const rapidcleanAPI = new api.RestApi(this, 'rtbAPI', {
      restApiName: 'rtb-items-service',
      description: 'AWS CDK IaC for API Gateway, DynamoDB with Lambda Proxy integration',
      deployOptions: {
        stageName: 'stage',
      },
      // if you want to manage binary types, uncomment the following
      // binaryMediaTypes; ["*/*"],
    });

    //attach the integration(s) to the api
    const rootMethod = rapidcleanAPI.root.addMethod(
        'ANY',
        lambdaFunctionIntegration
    );
    // root.addMethod('ANY', lambdaFunctionIntegration);
    addCorsOptions(rapidcleanAPI.root);

    const items = rapidcleanAPI.root.addResource('items');
    items.addMethod('ANY', lambdaFunctionIntegration);
    addCorsOptions(items);

    // const singleItem = items.addResource('{proxy+}')
    // singleItem.addMethod('GET', lambdaFunctionIntegration);
    // addCorsOptions(singleItem);

    const proxy = items.addProxy({
      anyMethod: true,
      defaultMethodOptions: {
        authorizationType: api.AuthorizationType.NONE,
        requestParameters: {
          'method.request.path.proxy': true
        }
      }
    });
    proxy.addMethod('GET', lambdaFunctionIntegration);
    addCorsOptions(proxy);

    // const helloApi = root.addResource('hello');
    // helloApi.addMethod('POST', lambdaFunctionIntegration);
    // addCorsOptions(helloApi);

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: rapidcleanAPI.url ?? 'Something went wrong with the deploy'
    });
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    // In case you want to use binary media types, uncomment the following line
    // contentHandling: ContentHandling.CONVERT_TO_TEXT,
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    // In case you want to use binary media types, comment out the following line
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
      },
    }]
  })
}
