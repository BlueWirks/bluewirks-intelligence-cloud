export type AssetType = "pro_tools_session" | "unity_scene" | "document" | "media_manifest";

export interface ParsedAsset {
  assetType: AssetType;
  content: string;
  metadata: Record<string, unknown>;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  content: string;
  byteOffset: number;
  byteLength: number;
  metadata: Record<string, unknown>;
}

export interface Chunk {
  chunkId: string;
  content: string;
  byteOffset: number;
  byteLength: number;
  metadata: Record<string, unknown>;
}
