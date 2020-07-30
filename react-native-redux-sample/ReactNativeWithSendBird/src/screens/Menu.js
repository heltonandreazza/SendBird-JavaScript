import React, { useState, useLayoutEffect } from 'react'
import { View } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
// import { connect } from 'react-redux'
import firebase from 'react-native-firebase'
import { NavigationActions, StackActions } from 'react-navigation'
// import { sendbirdLogout, initMenu } from '../actions'
import {
  sbConnect, sbDisconnect, sbOnTokenRefreshListener, sbOnMessageListener, sbUnregisterPushToken,
} from '../sendbirdActions'
import { Button, HR, Spinner } from '../components'

const pushNotificationEnabled = false

const Menu = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)

  function redirectTo(page, params, actions, index) {
    navigation.dispatch(
      StackActions.reset({
        index: index || 0,
        actions: actions || [NavigationActions.navigate({ routeName: page, params })],
      }),
    )
  }

  useLayoutEffect(() => {
    // logout in case there is no user
    AsyncStorage.getItem('user', (err, result) => {
      if (!result) {
        setIsLoading(false)
        redirectTo('Login')
      }
    })
    // add event listeners for notifications
    const onTokenRefreshListener = sbOnTokenRefreshListener()
    const onMessageListener = sbOnMessageListener()
    const onPushNotificationOpened = firebase.notifications().onNotificationOpened((notif) => {
      firebase.notifications().removeAllDeliveredNotifications()
      AsyncStorage.getItem('user', (err, result) => {
        if (result) {
          const user = JSON.parse(result)
          sbConnect(user.userId, user.nickname)
            .then(() => {
              let payload = notif.notification.data
              if (!payload.hasOwnProperty('channel') && payload.hasOwnProperty('sendbird')) {
                payload = payload.sendbird
              }
              const isOpenChannel = () => payload.channel_type !== 'group_messaging' && payload.channel_type !== 'messaging'
              const channelType = isOpenChannel() ? 'OpenChannel' : 'GroupChannel'
              const index = 2
              const actions = [
                NavigationActions.navigate({ routeName: 'Menu' }),
                NavigationActions.navigate({ routeName: channelType }),
                NavigationActions.navigate({
                  routeName: 'Chat',
                  params: {
                    channelUrl: payload.channel.channel_url,
                    newTitle: payload.channel.name,
                    isOpenChannel: isOpenChannel(),
                    isFromPayload: true,
                  },
                }),
              ]
              redirectTo('Login', null, actions, index)
            })
            .catch(() => {
              redirectTo('Login')
            })
        } else {
          redirectTo('Login')
        }
      })
    })
    firebase
      .messaging()
      .hasPermission()
      .then((enabled) => {
        if (enabled) {
          console.info('pushNotificationEnabled true')
        } else {
          firebase
            .messaging()
            .requestPermission()
            .then(() => console.info('pushNotificationEnabled true'))
            .catch((err) => console.info('pushNotificationEnabled false', err))
        }
      })
    firebase.notifications().removeAllDeliveredNotifications()
    return () => {
      onTokenRefreshListener()
      onMessageListener()
      onPushNotificationOpened()
    }
  }, [])

  const sendbirdLogout = () => sbDisconnect().then(() => redirectTo('Login'))

  const onProfileButtonPress = () => navigation.navigate('Profile')
  const onOpenChannelPress = () => navigation.navigate('OpenChannel')
  const onGroupChannelPress = () => navigation.navigate('GroupChannel')
  const onDisconnectButtonPress = () => {
    setIsLoading(true)
    sbUnregisterPushToken()
      .then(sendbirdLogout)
      .catch(() => setIsLoading(false))
  }

  return (
    <View style={styles.containerViewStyle}>
      <Spinner visible={isLoading} />
      <Button
        containerViewStyle={styles.menuViewStyle}
        buttonStyle={styles.buttonStyle}
        backgroundColor="#fff"
        color="#6e5baa"
        icon={{
          name: 'user',
          type: 'font-awesome',
          color: '#6e5baa',
          size: 16,
        }}
        title="Profile"
        onPress={onProfileButtonPress}
      />
      <HR />
      <Button
        containerViewStyle={styles.menuViewStyle}
        buttonStyle={styles.buttonStyle}
        backgroundColor="#fff"
        color="#6e5baa"
        icon={{
          name: 'slack',
          type: 'font-awesome',
          color: '#6e5baa',
          size: 16,
        }}
        title="Open Channel"
        onPress={onOpenChannelPress}
      />
      <HR />
      <Button
        containerViewStyle={styles.menuViewStyle}
        buttonStyle={styles.buttonStyle}
        backgroundColor="#fff"
        color="#6e5baa"
        icon={{
          name: 'users',
          type: 'font-awesome',
          color: '#6e5baa',
          size: 16,
        }}
        title="Group Channel"
        onPress={onGroupChannelPress}
      />
      <HR />
      <Button
        containerViewStyle={styles.menuViewStyle}
        buttonStyle={styles.buttonStyle}
        backgroundColor="#fff"
        color="#6e5baa"
        icon={{
          name: 'sign-out',
          type: 'font-awesome',
          color: '#6e5baa',
          size: 16,
        }}
        title="Disconnect"
        onPress={onDisconnectButtonPress}
      />
      <HR />
    </View>
  )
}

Menu.navigationOptions = {
  title: 'Sendbird',
}

export default Menu

const styles = {
  containerViewStyle: {
    backgroundColor: '#fff',
    flex: 1,
  },
  menuViewStyle: {
    marginLeft: 0,
    marginRight: 0,
  },
  buttonStyle: {
    justifyContent: 'flex-start',
    paddingLeft: 14,
  },
}
