/**
 * Amplify configuration.
 * Values are injected via environment variables at build time by Amplify Hosting.
 */

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
    },
  },
};

export const apiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
};
