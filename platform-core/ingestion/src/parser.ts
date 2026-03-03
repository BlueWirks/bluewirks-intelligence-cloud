import { Storage } from "@google-cloud/storage";
import type { ParsedAsset, AssetType } from "./types.js";

const storage = new Storage();

/**
 * Downloads and parses an asset from GCS based on its type.
 * Each asset type has a dedicated adapter.
 */
export async function parseAsset(objectPath: string, assetType: string): Promise<ParsedAsset> {
  const bucket = storage.bucket(process.env.ASSET_BUCKET || "bluewirks-assets");
  const [content] = await bucket.file(objectPath).download();
  const text = content.toString("utf-8");

  switch (assetType as AssetType) {
    case "pro_tools_session":
      return parseProToolsSession(text);
    case "unity_scene":
      return parseUnityScene(text);
    case "document":
      return parseDocument(text);
    case "media_manifest":
      return parseMediaManifest(text);
    default:
      return parseDocument(text);
  }
}

function parseProToolsSession(text: string): ParsedAsset {
  // TODO: Implement Pro Tools session parser
  return {
    assetType: "pro_tools_session",
    content: text,
    metadata: { parser: "pro_tools_v1" },
    sections: [{ id: "full", title: "Full Session", content: text, byteOffset: 0, byteLength: Buffer.byteLength(text), metadata: {} }],
  };
}

function parseUnityScene(text: string): ParsedAsset {
  // TODO: Implement Unity scene parser
  return {
    assetType: "unity_scene",
    content: text,
    metadata: { parser: "unity_v1" },
    sections: [{ id: "full", title: "Full Scene", content: text, byteOffset: 0, byteLength: Buffer.byteLength(text), metadata: {} }],
  };
}

function parseDocument(text: string): ParsedAsset {
  return {
    assetType: "document",
    content: text,
    metadata: { parser: "document_v1" },
    sections: [{ id: "full", title: "Full Document", content: text, byteOffset: 0, byteLength: Buffer.byteLength(text), metadata: {} }],
  };
}

function parseMediaManifest(text: string): ParsedAsset {
  // TODO: Implement media manifest parser
  return {
    assetType: "media_manifest",
    content: text,
    metadata: { parser: "media_manifest_v1" },
    sections: [{ id: "full", title: "Full Manifest", content: text, byteOffset: 0, byteLength: Buffer.byteLength(text), metadata: {} }],
  };
}
