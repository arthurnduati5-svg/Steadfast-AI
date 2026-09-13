export type ApiResponseMeta = {
  requestId: string;
  timestamp: string;
  route: string;
  method: string;
  contractVersion: string;
  canonical?: boolean;
  legacy?: boolean;
  cache?: import('./apiMetadataContracts').ApiCacheMeta;
  sourceTrust?: import('./apiMetadataContracts').ApiSourceTrustMeta;
  dataSourceTruth?: import('./apiMetadataContracts').ApiDataSourceTruthMeta;
  privacy?: import('./apiMetadataContracts').ApiPrivacyMeta;
  safeguarding?: import('./apiMetadataContracts').ApiSafeguardingMeta;
  socratic?: import('./apiMetadataContracts').ApiSocraticMeta;
  pagination?: import('./apiPaginationContracts').ApiPaginationMeta;
};

export type ApiSuccessEnvelope<TData, TMeta = ApiResponseMeta> = {
  ok: true;
  data: TData;
  meta: TMeta;
};

export type ApiErrorEnvelope<TDetails = unknown> = {
  ok: false;
  error: {
    type: string;
    code: string;
    message: string;
    status: number;
    requestId?: string;
    details?: TDetails;
    safeUserMessage?: string;
  };
  meta: ApiResponseMeta;
};

export const API_CONTRACT_VERSION = '1.0.0';
