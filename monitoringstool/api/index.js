// Vercel API route - serve Express as serverless function
import app from '../server/server.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default app;