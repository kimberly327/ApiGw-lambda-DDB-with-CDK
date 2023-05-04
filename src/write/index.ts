import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const client = new DynamoDBClient();
const { DYNAMODB } = process.env;

export const handler = async (event :any) => {
    const body = JSON.parse(event.body);
    const params = {
        "ExpressionAttributeNames": {
            "#room": "roomId",
            "#user": "userId"
        },
        "ExpressionAttributeValues": {
            ":r": {
                "S": body.roomId
            },
            ":u": {
                "S": body.userId
            }
        },
        "Key": {
            "PK": {
                "S": new Date().toISOString()
            },
            "SK": {
                "S": "Detail"
            }
        },
        "ReturnValues": "ALL_NEW",
        "TableName": DYNAMODB,
        "UpdateExpression": "SET #user = :u, #room = :r"
    };
    const command = new UpdateItemCommand(params);

    try {
        const response = await client.send(command);
        console.log(response);
        return  {
            body: JSON.stringify({ response }),
            headers: {}
        };
    }
    catch (err) {
        console.error(err);
    }
};
