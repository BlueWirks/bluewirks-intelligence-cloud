export type SignedUpload = {
  bucket: string;
  objectPath: string;
  gcsUri: string;
  url: string;
  expiresInSeconds: number;
};
