import { Stack, StackProps }from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkProjStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dynamodb_table = new dynamodb.Table(this, "Table", {
      tableName: 'DDB-Table',
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const lambdaFunction = new lambda.Function(this, "lambdaFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("src"),
      environment: {
        DYNAMODB: dynamodb_table.tableName
      },
    });
    
    dynamodb_table.grantReadWriteData(lambdaFunction.role!);

    const api = new apigateway.LambdaRestApi(this, 'api', {
      handler: lambdaFunction,
      proxy: false,
      integrationOptions: {
        requestTemplates: {
          'application/json': JSON.stringify({
            'userId': { "S": "$util.escapeJavaScript($input.json('$.userId'))" },
            'roomId': { "S": "$util.escapeJavaScript($input.json('$.roomId'))" }
          })
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
          {
            statusCode: '400',
          },
          {
            statusCode: '500',
          }
        ]
      }
    });

    const writing = api.root.addResource('addingItem');
    
    writing.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunction), {
      requestValidatorOptions: {
        requestValidatorName: 'test-validator',
        validateRequestBody: true,
        validateRequestParameters: false
      },
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
      ]
    });
    
  }
}
