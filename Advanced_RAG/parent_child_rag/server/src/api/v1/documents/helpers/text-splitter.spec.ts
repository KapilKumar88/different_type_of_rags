import { splitDocumentIntoParents } from './text-splitter';

describe('splitDocumentIntoParents', () => {
  it('splits text into parents and children, inheriting page numbers', async () => {
    const longText = 'Word '.repeat(800);

    const parents = await splitDocumentIntoParents({
      pages: [{ text: longText, pageNumber: 3 }],
    });

    expect(parents.length).toBeGreaterThan(0);
    expect(parents[0]?.pageNumber).toBe(3);
    expect(parents[0]?.children.length).toBeGreaterThan(0);
    expect(parents[0]?.children[0]?.pageNumber).toBe(3);
  });

  it('assigns contiguous document-global parentIndex across pages', async () => {
    const longText = 'Word '.repeat(600);

    const parents = await splitDocumentIntoParents({
      pages: [
        { text: longText, pageNumber: 1 },
        { text: longText, pageNumber: 2 },
      ],
    });

    const indices = parents.map((p) => p.parentIndex);

    expect(indices[0]).toBe(0);
    expect(indices).toEqual(indices.map((_, i) => i));
  });

  it('each parent chunk text is longer than its child chunk texts', async () => {
    const longText = 'Word '.repeat(600);

    const parents = await splitDocumentIntoParents({
      pages: [{ text: longText }],
    });

    for (const parent of parents) {
      for (const child of parent.children) {
        expect(parent.text.length).toBeGreaterThanOrEqual(child.text.length);
      }
    }
  });

  it('drops parents that produce no children and returns empty for blank input', async () => {
    const parents = await splitDocumentIntoParents({
      pages: [{ text: '   \n\n   ' }],
    });

    expect(parents).toEqual([]);
  });

  it('omits pageNumber when the page has none', async () => {
    const longText = 'Word '.repeat(400);

    const parents = await splitDocumentIntoParents({
      pages: [{ text: longText }],
    });

    expect(parents[0]?.pageNumber).toBeUndefined();
    expect(parents[0]?.children[0]?.pageNumber).toBeUndefined();
  });
});
