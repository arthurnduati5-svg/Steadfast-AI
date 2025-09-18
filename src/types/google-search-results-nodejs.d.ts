declare module 'google-search-results-nodejs' {
    export class GoogleSearchResults {
      constructor(apiKey: string);
      json(params: any): Promise<any>;
    }
    export const search: GoogleSearchResults;
    export const scrape: any;
  }