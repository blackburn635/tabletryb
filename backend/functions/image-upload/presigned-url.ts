/** POST /v1/households/{householdId}/images/presigned-url */
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAuthUser, requireHouseholdAccess } from '../_shared/auth';
import { success, error, parseBody, getPathParam } from '../_shared/response';
import { generateId } from '../_shared/dynamo';

const s3 = new S3Client({});
const BUCKET = process.env.RECIPE_IMAGE_BUCKET!;

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    const householdId = getPathParam(event.pathParameters, 'householdId');
    requireHouseholdAccess(user, householdId);
    const body = parseBody<{ contentType: string; fileName: string }>(event.body);
    const ext = body.fileName.split('.').pop() || 'jpg';
    const key = `recipe-images/${householdId}/${generateId()}.${ext}`;
    const url = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: BUCKET, Key: key, ContentType: body.contentType,
    }), { expiresIn: 300 });
    return success({ uploadUrl: url, imageKey: key, imageUrl: `https://${BUCKET}.s3.amazonaws.com/${key}` });
  } catch (err) { return error(err); }
};
