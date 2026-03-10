/**
 * DynamoDB client and helper utilities.
 * Centralizes the float conversion pattern from the prototype.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
  type GetCommandInput,
  type PutCommandInput,
  type QueryCommandInput,
  type DeleteCommandInput,
  type UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * Convert DynamoDB Decimal/float values to JavaScript numbers.
 * Centralizes the pattern that was scattered across the prototype Lambdas.
 */
export function convertFloats(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'boolean') return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertFloats);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertFloats(value);
    }
    return result;
  }

  return obj;
}

/** Helper: Get a single item */
export async function getItem(pk: string, sk: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    })
  );
  return result.Item ? convertFloats(result.Item) : null;
}

/** Helper: Put an item */
export async function putItem(item: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

/** Helper: Query by PK with optional SK prefix */
export async function queryByPK(
  pk: string,
  skPrefix?: string,
  options?: { indexName?: string; limit?: number; scanForward?: boolean }
) {
  const params: QueryCommandInput = {
    TableName: TABLE_NAME,
    KeyConditionExpression: skPrefix
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk',
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':sk': skPrefix }
      : { ':pk': pk },
    ...(options?.indexName && { IndexName: options.indexName }),
    ...(options?.limit && { Limit: options.limit }),
    ...(options?.scanForward !== undefined && { ScanIndexForward: options.scanForward }),
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items || []).map((item) => convertFloats(item));
}

/** Helper: Query a GSI */
export async function queryGSI(
  indexName: string,
  pkName: string,
  pkValue: string,
  skPrefix?: string,
  skName?: string
) {
  const params: QueryCommandInput = {
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: skPrefix && skName
      ? `${pkName} = :pk AND begins_with(${skName}, :sk)`
      : `${pkName} = :pk`,
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pkValue, ':sk': skPrefix }
      : { ':pk': pkValue },
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items || []).map((item) => convertFloats(item));
}

/** Helper: Delete an item */
export async function deleteItem(pk: string, sk: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    })
  );
}

/** Generate a short random ID */
export function generateId(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
