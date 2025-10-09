import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
  // The environment is now part of the baseUrl.
  // Example: "https://<YOUR_INDEX_NAME>-<YOUR_PROJECT_ID>.svc.<YOUR_ENVIRONMENT>.pinecone.io"
  // You will need to construct this based on your Pinecone console.
  // For simplicity, if your API key implies the environment, you might only need the apiKey.
  // However, if a baseUrl is required, it should be set like this:
  // baseUrl: `https://your-index-name-your-project-id.svc.${process.env.PINECONE_ENVIRONMENT}.pinecone.io`,
  // For now, I'll remove the `environment` and assume apiKey might suffice or you'll set baseUrl.
  // If you have a specific baseUrl, please update this.
});

export default pinecone;
