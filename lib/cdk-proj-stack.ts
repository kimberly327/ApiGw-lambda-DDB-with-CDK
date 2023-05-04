import { Stack, StackProps }from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class CdkProjStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dynamodb_table = new dynamodb.Table(this, "Table", {
      tableName: 'DDB-Table',
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const writeFunction = new lambdaNode.NodejsFunction(this, "writeFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../src/write/index.ts"),
      handler: 'handler',
      environment: {
        DYNAMODB: dynamodb_table.tableName
      },
    });

    const readFunction = new lambdaNode.NodejsFunction(this, "readFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../src/read/index.ts"),
      handler: 'handler',
      environment: {
        DYNAMODB: dynamodb_table.tableName
      },
    });
    
    dynamodb_table.grantReadWriteData(writeFunction.role!);
    dynamodb_table.grantReadData(readFunction.role!);
    
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'MyApi',
    });

    const writeModel = api.addModel('write-validator-model', {
      schema: {
        properties: {
          userId: { 
            type: apigateway.JsonSchemaType.STRING
          },
          roomId: { 
            type: apigateway.JsonSchemaType.STRING
          },
        },
        required: ['userId', 'roomId']
      }
    })

    const readModel = api.addModel('read-validator-model', {
      schema: {
        properties: {
          PK: { 
            type: apigateway.JsonSchemaType.STRING
          },
        },
        required: ['PK']
      }
    })

    api.addRequestValidator('validator', {
      validateRequestBody: true,
      validateRequestParameters: false
    })

    const dynamo = api.root.addResource('dynamo');
    
    dynamo.addMethod('POST', new apigateway.LambdaIntegration(writeFunction), {
      methodResponses: [
        {
          statusCode: '400',
        },
        {
          statusCode: '200',
        },
        {
          statusCode: '500',
        }
      ],
      requestModels: { 
        'application/json': writeModel
      }
    });

    dynamo.addMethod('GET', new apigateway.LambdaIntegration(readFunction), {
      methodResponses: [
        {
          statusCode: '400',
        },
        {
          statusCode: '200',
        },
        {
          statusCode: '500',
        }
      ],
      requestModels: { 
        'application/json': readModel
      }
    });
    
  }
}
