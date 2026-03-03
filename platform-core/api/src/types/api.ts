export type SignedUpload = {
  bucket: string;
  objectPath: string;
  url: string;
  expiresInSeconds: number;
};
