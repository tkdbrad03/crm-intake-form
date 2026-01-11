export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const sharedToken = process.env.SHARED_TOKEN;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;

    if (!sharedToken || !appsScriptUrl) {
      console.error('Missing environment variables');
      return res.status(500).json({ ok: false, message: 'Server configuration error' });
    }

    const requiredFields = [
      'businessName',
      'contactName',
      'email',
      'phone',
      'role',
      'goLiveDate',
      'primaryGoal',
      'currentTools',
      'leadSources',
      'paymentModel',
      'numberOfUsers',
      'customerUpdates',
      'budgetRange',
      'decisionMaker'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ ok: false, message: `Missing required field: ${field}` });
      }
    }

    if (!Array.isArray(req.body.priorities) || req.body.priorities.length === 0 || req.body.priorities.length > 6) {
      return res.status(400).json({ ok: false, message: 'Priorities must be an array with 1-6 items' });
    }

    const payload = {
      ...req.body,
      token: sharedToken
    };

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with status ${response.status}`);
    }

    const result = await response.json();

    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    console.error('Error forwarding to Apps Script:', error.message);
    return res.status(500).json({ ok: false, message: 'Failed to submit form' });
  }
}
