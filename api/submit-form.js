// api/submit-form.js

// 1. Airtable से बात करने के लिए ज़रूरी लाइब्रेरी को इम्पोर्ट करें
// (इसे चलाने के लिए 'npm install airtable' कमांड चलाना ज़रूरी है)
const Airtable = require('airtable');

// 2. Vercel की सेटिंग्स से सुरक्षित रूप से अपनी चाबियाँ (Keys) निकालें
// process.env का मतलब है Environment Variables से वैल्यू उठाओ
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const tableName = process.env.AIRTABLE_TABLE_NAME;

// 3. Vercel को बताने के लिए कि यह एक फंक्शन है, इस तरह से कोड एक्सपोर्ट करें
export default async function handler(req, res) {
  // 'req' (Request) में यूजर का भेजा हुआ डेटा होता है
  // 'res' (Response) से हम यूजर को जवाब भेजते हैं

  // 4. सुरक्षा जांच: सिर्फ POST मेथड वाले अनुरोधों को ही स्वीकार करें
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    // 5. यूजर द्वारा भेजे गए JSON डेटा को निकालें (name, email, message)
    const { name, email, message } = req.body;

    // 6. Airtable की सही टेबल में एक नया रिकॉर्ड (नई पंक्ति) बनाएँ
    await base(tableName).create([
      {
        fields: {
          // ध्यान दें: 'Name', 'Email' वही नाम हैं जो आपने Airtable कॉलम को दिए हैं
          'Name': name,
          'Email': email,
          'Message': message,
        },
      },
    ]);

    // 7. अगर सब ठीक रहा, तो यूजर को सफलता का संदेश भेजें
    res.status(200).json({ message: 'Success! Your form has been submitted.' });

  } catch (error) {
    // 8. अगर कोई गड़बड़ी हुई, तो एरर को कंसोल में दिखाएं और यूजर को एरर का संदेश भेजें
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}
