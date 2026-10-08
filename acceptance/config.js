/** Where the system under test and its stubbed dependencies are running. */
export const config = {
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  googleStubUrl: (process.env.GOOGLE_STUB_URL || 'http://localhost:3999').replace(/\/+$/, ''),
  operatorApiKey: process.env.OPERATOR_API_KEY || 'acceptance-operator-key',
  chromiumPath: process.env.CHROMIUM_PATH || undefined,
};
