export const PDF_MIME_TYPE = 'application/pdf';

export function isPdf(mimeType: string): boolean {
  return mimeType === PDF_MIME_TYPE;
}

export async function extractPdfText(data: Buffer): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const fonts = `${require.resolve('pdfjs-dist/package.json').replace(/package\.json$/, '')}standard_fonts/`;

  const task = getDocument({
    data: new Uint8Array(data),
    useSystemFonts: false,
    standardFontDataUrl: fonts,
  });
  const document = await task.promise;

  try {
    const pages: string[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      );
    }
    return pages.filter(Boolean).join('\n\n');
  } finally {
    await task.destroy();
  }
}
