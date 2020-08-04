import SendBird from 'sendbird'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import firebase from 'react-native-firebase'

const APP_ID = '9DA1B1F4-0BE6-4DA8-82C5-2E81DAB56F23' // sendbird open APP_ID sample

export const sbOnMessageListener = () => firebase.messaging().onMessage((message) => {
  if (Platform.OS === 'ios') {
    const text = message.data.message
    const payload = JSON.parse(message.data.sendbird)
    const localNotification = new firebase.notifications.Notification({
      show_in_foreground: true,
    })
      .setNotificationId(message.messageId)
      .setTitle('New message')
      .setSubtitle(`Unread message: ${payload.unread_message_count}`)
      .setBody(text)
      .setData(payload)
    firebase.notifications().displayNotification(localNotification)
  }
})

export const sbOnTokenRefreshListener = () => firebase.messaging().onTokenRefresh((fcmToken) => {
  sbRegisterPushToken(fcmToken)
    .then((res) => {
      console.log('sbRegisterPushToken success', res)
    })
    .catch((err) => {
      console.log('sbRegisterPushToken error', err)
    })
})

export const sbRegisterPushToken = () => new Promise((resolve, reject) => {
  const sb = SendBird.getInstance()
  if (Platform.OS === 'ios') {
    // WARNING! FCM token doesn't work in request to APNs.
    // Use APNs token here instead.
    firebase
      .messaging()
      .ios.getAPNSToken()
      .then(token => {
        if (token) {
          sb.registerAPNSPushTokenForCurrentUser(token, (result, error) => {
            if (!error) {
              resolve();
            } else reject(error);
          });
        } else {
          resolve();
        }
      })
      .catch(error => {
        reject(error);
      });
  } else {
    firebase
      .messaging()
      .getToken()
      .then((token) => {
        if (token) {
          sb.registerGCMPushTokenForCurrentUser(token, (result, error) => {
            if (!error) {
              resolve()
            } else reject(error)
          })
        } else {
          resolve()
        }
      })
      .catch((error) => {
        reject(error)
      })
  }
})
export const sbUnregisterPushToken = () => new Promise((resolve, reject) => {
  firebase
    .messaging()
    .getToken()
    .then((token) => {
      const sb = SendBird.getInstance()
      if (sb) {
        if (Platform.OS === 'ios') {
          firebase
            .messaging()
            .ios.getAPNSToken()
            .then((apnsToken) => {
              if (!apnsToken) {
                return resolve()
              }
              sb.unregisterAPNSPushTokenForCurrentUser(apnsToken, (result, error) => {
                if (!error) {
                  resolve()
                } else reject(error)
              })
            })
            .catch((err) => reject(err))
        } else {
          sb.unregisterGCMPushTokenForCurrentUser(token, (result, error) => {
            if (!error) {
              resolve()
            } else reject(error)
          })
        }
      } else {
        reject('SendBird is not initialized')
      }
    })
    .catch((err) => reject(err))
})

export const sbConnect = (userId, nickname) => new Promise((resolve, reject) => {
  if (!userId) {
    reject('UserID is required.')
    return
  }
  if (!nickname) {
    reject('Nickname is required.')
    return
  }
  const sb = new SendBird({ appId: APP_ID })
  sb.connect(userId, (user, error) => {
    if (error) {
      reject('SendBird Login Failed.')
    } else {
      resolve(sbUpdateProfile(nickname))
    }
  })
})

export const sbUpdateProfile = (nickname) => new Promise((resolve, reject) => {
  if (!nickname) {
    reject('Nickname is required.')
    return
  }
  let sb = SendBird.getInstance()
  if (!sb) sb = new SendBird({ appId: APP_ID })
  sb.updateCurrentUserInfo(nickname, null, (user, error) => {
    if (error) {
      reject('Update profile failed.')
    } else {
      AsyncStorage.setItem('user', JSON.stringify(user), () => {
        resolve(user)
      })
    }
  })
})

export const sbDisconnect = () => new Promise((resolve, reject) => {
  const sb = SendBird.getInstance()
  if (sb) {
    AsyncStorage.removeItem('user', () => {
      sb.disconnect(() => {
        resolve(null)
      })
    })
  } else {
    resolve(null)
  }
})

export const sbGetCurrentInfo = () => {
  const sb = SendBird.getInstance()
  if (sb.currentUser) {
    return {
      profileUrl: sb.currentUser.profileUrl,
      nickname: sb.currentUser.nickname,
    }
  }
  return {}
}

export const sbUserBlock = (blockUserId) => new Promise((resolve, reject) => {
  const sb = SendBird.getInstance()
  sb.blockUserWithUserId(blockUserId, (user, error) => {
    if (error) {
      reject(error)
    } else {
      resolve(user)
    }
  })
})

export const sbUserUnblock = (unblockUserId) => new Promise((resolve, reject) => {
  const sb = SendBird.getInstance()
  sb.unblockUserWithUserId(unblockUserId, (user, error) => {
    if (error) {
      reject(error)
    } else {
      resolve(user)
    }
  })
})

export const sbCreateBlockedUserListQuery = () => {
  const sb = SendBird.getInstance()
  return sb.createBlockedUserListQuery()
}

export const sbGetBlockUserList = (blockedUserListQuery) => new Promise((resolve, reject) => {
  blockedUserListQuery.next((blockedUsers, error) => {
    if (error) {
      reject(error)
    } else {
      resolve(blockedUsers)
    }
  })
})
