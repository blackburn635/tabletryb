/** GET /v1/stores/supported — List all supported grocery stores */
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { success, error } from '../_shared/response';
import { SUPPORTED_STORES } from '@tabletryb/shared';

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  try {
    return success({ stores: SUPPORTED_STORES });
  } catch (err) { return error(err); }
};
