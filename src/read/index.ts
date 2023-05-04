import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
const client = new DynamoDBClient();
const { DYNAMODB } = process.env;

export const handler = async (event :any) => {
    const headers = event.headers;
    console.log(headers);
    const params = {
      "Key": {
        "PK": {
          "S": JSON.stringify(headers.PK)
        },
        "SK": {
          "S": "Detail"
        },
      },
      "TableName": DYNAMODB,
    };
    const command = new GetItemCommand(params);
    try {
      const response = await client.send(command);
      console.log(JSON.stringify(response));
      return {
        body: JSON.stringify({ response }),
        headers: {}
      };
    } catch (err) {
      console.error(err);
    }
  };
