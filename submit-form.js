// airtable-node पैकेज इनस्टॉल करना होगा
// npm install airtable
const Airtable = require('airtable');

// Vercel Environment Variables से अपनी Keys को सुरक्षित रूप से एक्सेस करें
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const tableName = process.env.AIRTABLE_TABLE_NAME;

// यह हमारा सर्वरलेस फंक्शन है
export default async function handler(req, res) {
  // सिर्फ POST रिक्वेस्ट को अनुमति दें
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Airtable में नया रिकॉर्ड बनाएँ
    const createdRecords = await base(tableName).create([
      {
        fields: {
          Name: name,
          Email: email,
          Message: message,
        },
      },
    ]);

    // सफलता का संदेश भेजें
    res.status(200).json({ message: 'Success', record: createdRecords[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}