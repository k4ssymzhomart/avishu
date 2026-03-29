const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

initializeApp();
setGlobalOptions({ maxInstances: 10, region: 'us-central1' });

const db = getFirestore();

const USERS_COLLECTION = 'users';
const USER_NOTIFICATIONS_SUBCOLLECTION = 'notifications';
const USER_PUSH_TOKENS_SUBCOLLECTION = 'pushTokens';
const DEFAULT_NOTIFICATION_CHANNEL = 'order-status';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildRoleUrl(role, orderId) {
  if (role === 'customer') {
    return orderId ? '/customer/orders' : '/customer/notifications';
  }

  if (role === 'franchisee') {
    return orderId ? '/franchisee/orders' : '/franchisee/notifications';
  }

  return orderId ? '/production' : '/production/notifications';
}

function buildNotificationSpecs(before, after) {
  const branchLabel = after.branchName || 'AVISHU boutique';

  if (!before) {
    return [
      {
        body: `${after.productName} is now waiting for boutique confirmation.`,
        eventKey: 'order_placed',
        role: 'customer',
        title: 'Order placed',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.customerName} placed ${after.productName}. Review it in the live orders desk.`,
        eventKey: 'order_placed',
        role: 'franchisee',
        title: 'New order placed',
        url: buildRoleUrl('franchisee', after.id),
      },
    ];
  }

  if (before.status === after.status) {
    return [];
  }

  if (after.status === 'accepted') {
    return [
      {
        body: `${branchLabel} accepted ${after.productName}.`,
        eventKey: 'order_accepted',
        role: 'customer',
        title: 'Order accepted',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.productName} is ready for production intake from ${branchLabel}.`,
        eventKey: 'sent_to_production',
        role: 'production',
        title: 'Sent to production',
        url: buildRoleUrl('production', after.id),
      },
    ];
  }

  if (after.status === 'in_production') {
    return [
      {
        body: `${after.productName} moved into active production.`,
        eventKey: 'production_started',
        role: 'customer',
        title: 'Production started',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.productName} is now in active production.`,
        eventKey: 'production_started',
        role: 'franchisee',
        title: 'Production started',
        url: buildRoleUrl('franchisee', after.id),
      },
    ];
  }

  if (after.status === 'ready') {
    return [
      {
        body: `${after.productName} is ready for boutique handoff.`,
        eventKey: 'order_ready',
        role: 'customer',
        title: 'Order ready',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.productName} is ready for pickup or delivery release.`,
        eventKey: 'order_ready',
        role: 'franchisee',
        title: 'Ready for handoff',
        url: buildRoleUrl('franchisee', after.id),
      },
    ];
  }

  if (after.status === 'out_for_delivery') {
    return [
      {
        body: `${after.productName} is out for delivery.`,
        eventKey: 'out_for_delivery',
        role: 'customer',
        title: 'Out for delivery',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.productName} has left the boutique for delivery.`,
        eventKey: 'out_for_delivery',
        role: 'franchisee',
        title: 'Delivery handoff started',
        url: buildRoleUrl('franchisee', after.id),
      },
    ];
  }

  if (after.status === 'delivered') {
    return [
      {
        body: `${after.productName} was delivered successfully.`,
        eventKey: 'delivered',
        role: 'customer',
        title: 'Delivered',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.productName} was marked delivered.`,
        eventKey: 'delivered',
        role: 'franchisee',
        title: 'Order delivered',
        url: buildRoleUrl('franchisee', after.id),
      },
    ];
  }

  if (after.status === 'cancelled') {
    return [
      {
        body: `${after.productName} was cancelled. Boutique support will follow up if needed.`,
        eventKey: 'cancelled',
        role: 'customer',
        title: 'Order cancelled',
        url: buildRoleUrl('customer', after.id),
      },
      {
        body: `${after.productName} was cancelled and removed from the active flow.`,
        eventKey: 'cancelled',
        role: 'franchisee',
        title: 'Order cancelled',
        url: buildRoleUrl('franchisee', after.id),
      },
    ];
  }

  return [];
}

async function resolveRoleRecipientMap(order) {
  const recipientMap = {
    customer: unique([order.customerId]),
    franchisee: [],
    production: [],
  };

  if (!order.franchiseId) {
    return recipientMap;
  }

  const linkedUsersSnapshot = await db
    .collection(USERS_COLLECTION)
    .where('linkedFranchiseIds', 'array-contains', order.franchiseId)
    .get();

  linkedUsersSnapshot.forEach((documentSnapshot) => {
    const role = documentSnapshot.get('role');

    if (role === 'franchisee') {
      recipientMap.franchisee.push(documentSnapshot.id);
    }

    if (role === 'production') {
      recipientMap.production.push(documentSnapshot.id);
    }
  });

  recipientMap.franchisee = unique([...recipientMap.franchisee, order.franchiseId]);
  recipientMap.production = unique(recipientMap.production);

  return recipientMap;
}

async function createNotificationDocs(eventId, order, specs, recipientMap) {
  const batch = db.batch();
  const notificationsToSend = [];

  specs.forEach((spec) => {
    const recipientIds = recipientMap[spec.role] || [];

    recipientIds.forEach((recipientId) => {
      const notificationRef = db
        .collection(USERS_COLLECTION)
        .doc(recipientId)
        .collection(USER_NOTIFICATIONS_SUBCOLLECTION)
        .doc(`${eventId}-${recipientId}`);

      batch.set(
        notificationRef,
        {
          body: spec.body,
          createdAt: FieldValue.serverTimestamp(),
          eventKey: spec.eventKey,
          id: notificationRef.id,
          orderId: order.id,
          orderStatus: order.status,
          readAt: null,
          recipientRole: spec.role,
          title: spec.title,
          updatedAt: FieldValue.serverTimestamp(),
          url: spec.url,
        },
        { merge: true },
      );

      notificationsToSend.push({
        body: spec.body,
        orderId: order.id,
        orderStatus: order.status,
        recipientId,
        role: spec.role,
        title: spec.title,
        url: spec.url,
      });
    });
  });

  await batch.commit();

  return notificationsToSend;
}

function chunkMessages(messages, size) {
  const chunks = [];

  for (let index = 0; index < messages.length; index += size) {
    chunks.push(messages.slice(index, index + size));
  }

  return chunks;
}

async function loadPushMessages(notificationsToSend) {
  const pushMessages = [];

  for (const notification of notificationsToSend) {
    const tokensSnapshot = await db
      .collection(USERS_COLLECTION)
      .doc(notification.recipientId)
      .collection(USER_PUSH_TOKENS_SUBCOLLECTION)
      .get();

    tokensSnapshot.forEach((documentSnapshot) => {
      const expoPushToken = documentSnapshot.get('expoPushToken');

      if (!expoPushToken || typeof expoPushToken !== 'string') {
        return;
      }

      pushMessages.push({
        body: notification.body,
        channelId: DEFAULT_NOTIFICATION_CHANNEL,
        data: {
          orderId: notification.orderId,
          orderStatus: notification.orderStatus,
          role: notification.role,
          url: notification.url,
        },
        priority: 'high',
        sound: 'default',
        title: notification.title,
        to: expoPushToken,
      });
    });
  }

  return pushMessages;
}

async function sendExpoPushMessages(messages) {
  if (!messages.length) {
    return;
  }

  const chunks = chunkMessages(messages, 100);

  for (const messageChunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      body: JSON.stringify(messageChunk),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      logger.error('Expo push delivery failed', {
        responseText: await response.text().catch(() => 'Unavailable'),
        status: response.status,
      });
    }
  }
}

exports.sendOrderStatusNotifications = onDocumentWritten('orders/{orderId}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after = event.data.after.exists ? event.data.after.data() : null;

  if (!after) {
    return;
  }

  const specs = buildNotificationSpecs(before, after);

  if (!specs.length) {
    return;
  }

  const order = {
    branchName: after.branchName || null,
    customerId: after.customerId || null,
    customerName: after.customerName || 'AVISHU customer',
    franchiseId: after.franchiseId || null,
    id: after.id || event.params.orderId,
    productName: after.productName || 'AVISHU order',
    status: after.status || 'placed',
  };
  const eventId =
    event.id ||
    `${order.id}-${order.status}-${String(after.updatedAt || after.createdAt || event.timestamp || 'event')}`;

  const recipientMap = await resolveRoleRecipientMap(order);
  const notificationsToSend = await createNotificationDocs(eventId, order, specs, recipientMap);
  const pushMessages = await loadPushMessages(notificationsToSend);

  await sendExpoPushMessages(pushMessages);
});
