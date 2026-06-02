import { splitDocumentText } from './text-splitter';

describe('text splitter', () => {
  it('splits text into chunks and keeps page numbers when available', async () => {
    const text = Array.from({ length: 1200 }, (_, index) =>
      index % 2 === 0 ? 'A' : 'B',
    ).join('');

    const chunks = await splitDocumentText({
      pages: [{ text, pageNumber: 3 }],
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.pageNumber).toBe(3);
    expect(chunks.every((chunk) => chunk.text.length <= 800)).toBe(true);
  });

  it('removes empty chunks', async () => {
    const chunks = await splitDocumentText({
      pages: [{ text: '   \n\n   ' }],
    });

    expect(chunks).toEqual([]);
  });
});
