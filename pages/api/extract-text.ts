import { NextApiRequest, NextApiResponse } from 'next';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBase64, fileType } = req.body;
    if (!fileBase64 || !fileType) {
      return res.status(400).json({ error: 'fileBase64 and fileType are required' });
    }

    // Decode base64
    const buffer = Buffer.from(fileBase64, 'base64');
    let text = '';

    if (fileType === 'application/pdf') {
      // PDF extraction
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      // DOCX extraction
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Error extracting text' });
  }
} 