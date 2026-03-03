import type { ParsedAsset, Chunk } from "./types.js";

const DEFAULT_CHUNK_SIZE = 1000; // characters
const DEFAULT_OVERLAP = 200;    // characters

/**
 * Chunks a parsed asset into overlapping segments suitable for embedding.
 */
export function chunkContent(
  parsed: ParsedAsset,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const section of parsed.sections) {
    const text = section.content;
    let offset = 0;
    let chunkIndex = 0;

    while (offset < text.length) {
      const end = Math.min(offset + chunkSize, text.length);
      const chunkText = text.slice(offset, end);

      chunks.push({
        chunkId: `${section.id}-chunk-${chunkIndex}`,
        content: chunkText,
        byteOffset: section.byteOffset + Buffer.byteLength(text.slice(0, offset)),
        byteLength: Buffer.byteLength(chunkText),
        metadata: {
          ...section.metadata,
          sectionId: section.id,
          sectionTitle: section.title,
          chunkIndex,
          assetType: parsed.assetType,
        },
      });

      offset += chunkSize - overlap;
      chunkIndex++;
    }
  }

  return chunks;
}
