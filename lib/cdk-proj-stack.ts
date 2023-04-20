import { Stack, StackProps }from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkProjStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dynamodb_table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    const integrationRole = new iam.Role(this, 'IntegrationRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });

    dynamodb_table.grantReadWriteData(integrationRole);

    const api = new apigateway.RestApi(this, 'api', {});

    const sendMessageIntegration = new apigateway.AwsIntegration({
      service: 'dynamodb',
      integrationHttpMethod: 'POST',
      action: 'PutItem',
      options: {
        credentialsRole: integrationRole,
        requestParameters: {
          'integration.request.querystring.who': 'method.request.querystring.who'
        },
        requestTemplates: {
          'application/json': JSON.stringify({
            'TableName': dynamodb_table.tableName,
            'Item': {
              'PK': { 'S': "$context.requestTimeEpoch" },
              'SK': { 'S': "Detail" },
              'userId': {"S": "$util.escapeJavaScript($input.json('$.userId'))" },
              'roomId': {"S": "$util.escapeJavaScript($input.json('$.roomId'))" }
            }       
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
      },
    });

    const writing = api.root.addResource('addingItem');
    
    writing.addMethod('POST', sendMessageIntegration, {
      requestParameters: {
        'method.request.querystring.who': true
      },
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
