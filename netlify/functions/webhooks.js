const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object;
      const { leadId, userId } = paymentIntent.metadata;

      // Update lead in Firestore
      const leadRef = db.collection('leads').doc(leadId);
      const leadDoc = await leadRef.get();

      if (!leadDoc.exists) {
        throw new Error('Lead not found');
      }

      const leadData = leadDoc.data();
      const now = admin.firestore.Timestamp.now();

      // Prepare the update data
      const updates = {
        purchasedBy: admin.firestore.FieldValue.arrayUnion(userId),
        [`purchaseDates.${userId}`]: now,
        updatedAt: now
      };

      // Update status if needed
      if (!leadData.purchasedBy || leadData.purchasedBy.length === 0) {
        updates.status = 'Purchased';
      } else if (leadData.purchasedBy.length >= 2) { // Will be 3 after this purchase
        updates.status = 'Archived';
      }

      // Update the lead document
      await leadRef.update(updates);

      // Add payment record
      await db.collection('payments').add({
        leadId,
        userId,
        amount: paymentIntent.amount,
        status: 'succeeded',
        paymentIntentId: paymentIntent.id,
        createdAt: now
      });

      console.log(`Successfully processed payment for lead ${leadId}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }
};