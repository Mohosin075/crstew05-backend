import admin from 'firebase-admin'
import config from '../config'

let isInitialized = false

const getFirebaseAdmin = () => {
  if (isInitialized) return admin
  if (!config.firebase_service_account_base64) {
    return null
  }
  try {
    const serviceAccountJson = Buffer.from(
      config.firebase_service_account_base64,
      'base64',
    ).toString('utf8')
    const serviceAccount = JSON.parse(serviceAccountJson)

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      })
    }
    isInitialized = true
    return admin
  } catch {
    console.warn(
      '⚠️ Firebase initialization skipped: Invalid or missing service account credentials',
    )
    return null
  }
}

type NotificationData = { [key: string]: string }

export const sendPushNotification = async (
  deviceToken: string,
  title: string,
  body: string,
  data: NotificationData,
  icon?: string,
) => {
  const firebaseAdmin = getFirebaseAdmin()
  if (!firebaseAdmin) {
    console.log(
      'Firebase not configured. Push notification skipped for token:',
      deviceToken,
    )
    return null
  }

  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: { title, body },
    data,
    ...(icon && {
      android: {
        notification: { icon },
      },
    }),
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
        },
      },
    },
  }

  try {
    const response = await firebaseAdmin.messaging().send(message)
    console.log('Successfully sent message:', response)
    return response
  } catch (error: any) {
    console.error('Error sending message:', error?.message, error)
    return null
  }
}
