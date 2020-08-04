/* eslint-disable no-lonely-if */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import React, { useState, useLayoutEffect } from 'react'
import {
  Platform, View, FlatList, Text, Alert,
} from 'react-native'
import Permissions, { PERMISSIONS, RESULTS } from 'react-native-permissions'
import { BarIndicator } from 'react-native-indicators'
import ImagePicker from 'react-native-image-picker'
import SendBird from 'sendbird'
import {
  Button, Spinner, MessageInput, AdminMessage, MessageContainer,
} from '../components'
import {
  sbGetGroupChannel,
  sbGetOpenChannel,
  sbAdjustMessage,
} from '../sendbirdActions'

// sendbird
const getChannel = (isOpenChannel) => (isOpenChannel ? sbGetOpenChannel : sbGetGroupChannel)

let flatList = null

const Chat = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [textMessage, setTextMessage] = useState('')
  const [list, setList] = useState([])
  const [typing, setTyping] = useState('')
  const [currentChannel, setChannel] = useState('')

  useLayoutEffect(() => {
    const willFocusSubsription = navigation.addListener('willFocus', _init)
    _init()

    return () => {
      willFocusSubsription.remove()
      SendBird.getInstance().removeAllChannelHandlers()
    }
  }, [])

  const _init = async () => {
    SendBird.getInstance().removeAllChannelHandlers()
    const { channelUrl, isOpenChannel } = navigation.state.params
    const sbGetChannel = getChannel(isOpenChannel)
    const channel = await sbGetChannel(channelUrl)
    setChannel(currentChannel)
    createChatHandler(channelUrl, isOpenChannel)
    setIsLoading(true)
    _getMessageList()
    if (channel.isGroupChannel()) channel.markAsRead()
  }

  const getChannel = (isOpenChannel) => (isOpenChannel ? sbGetOpenChannel : sbGetGroupChannel)

  const _getMessageList = async () => {
    const { channelUrl, isOpenChannel } = navigation.state.params
    try {
      const sbGetChannel = getChannel(isOpenChannel)
      const channel = await sbGetChannel(channelUrl)
      const previousMessageListQuery = await channel.createPreviousMessageListQuery()
      if (previousMessageListQuery.hasMore) {
        const limit = 30
        const reverse = true
        previousMessageListQuery.load(limit, reverse, (messages, error) => {
          if (messages) {
            setList(messages)
            setIsLoading(false)
          }
        })
      }
    } catch (err) {
      setIsLoading(false)
    }
  }

  const registerOpenChannelHandler = (channelUrl) => {
    const sb = SendBird.getInstance()
    const channelHandler = new sb.ChannelHandler()

    channelHandler.onMessageReceived = (channel, message) => {
      if (channel.url === channelUrl) {
        if (channel.isGroupChannel()) channel.markAsRead()
        setList([message, ...list])
      }
    }

    sb.addChannelHandler(channelUrl, channelHandler)
  }

  const registerGroupChannelHandler = (channelUrl) => {
    const sb = SendBird.getInstance()
    const channelHandler = new sb.ChannelHandler()

    channelHandler.onMessageReceived = (channel, message) => {
      if (channel.url === channelUrl) {
        if (channel.isGroupChannel()) channel.markAsRead()
        setList([message, ...list])
      }
    }

    channelHandler.onReadReceiptUpdated = (channel) => {
      setChannel(channel)
      _getMessageList()
    }

    channelHandler.onTypingStatusUpdated = (channel) => {
      let typing = ''
      if (channel.isTyping()) {
        const typingMembers = channel.getTypingMembers()
        if (typingMembers.length == 1) typing = `${typingMembers[0].nickname} is typing...`
        else typing = 'several member are typing...'
      }
      setTyping(typing)
    }

    sb.addChannelHandler(channelUrl, channelHandler)
  }

  const createChatHandler = async (channelUrl, isOpenChannel) => {
    const sbGetChannel = getChannel(isOpenChannel)
    const channel = await sbGetChannel(channelUrl)
    if (isOpenChannel) {
      channel.enter((response, error) => console.info('sbOpenChannelEnter', (response, error)))
      registerOpenChannelHandler(channelUrl)
    } else {
      registerGroupChannelHandler(channelUrl)
    }
  }

  const _onTextMessageChanged = async (textMessage) => {
    const { channelUrl, isOpenChannel } = navigation.state.params
    const sbGetChannel = getChannel(isOpenChannel)
    const channel = await sbGetChannel(channelUrl)
    if (channel.isGroupChannel()) channel.startTyping()
    setTextMessage(textMessage)
  }

  const _onSendButtonPress = async () => {
    if (!textMessage) return

    const { channelUrl, isOpenChannel } = navigation.state.params

    const sbGetChannel = getChannel(isOpenChannel)
    const channel = await sbGetChannel(channelUrl)

    await channel.sendUserMessage(textMessage, (message, error) => {
      setList([message, ...list])
    })
    setTextMessage('')
    if (channel.isGroupChannel()) channel.endTyping()
    flatList.scrollToIndex({ index: 0, viewOffset: 0 })
  }

  const onFileButtonPress = async (channelUrl, isOpenChannel, file) => {
    const sbGetChannel = getChannel(isOpenChannel)
    const channel = await sbGetChannel(channelUrl)

    const data = ''
    const customType = ''
    const thumbSizeList = [{ maxWidth: 160, maxHeight: 160 }]
    const startTime = Date.now() / 1000
    const clearIntervalId = setInterval(() => {
      const curTime = Date.now() / 1000
      if (curTime - startTime > 1 * 60 * 60) {
        clearInterval(clearIntervalId)
      }
      if (SendBird.getInstance() && SendBird.getInstance().getConnectionState() === 'OPEN') {
        clearInterval(clearIntervalId)
        channel.sendFileMessage(file, data, customType, thumbSizeList, (message, error) => {
          if (message) {
            setList([message, ...list])
          }
        })
      }
    }, 500)
  }

  const _onPhotoAddPress = () => {
    const { channelUrl, isOpenChannel } = navigation.state.params
    Permissions.check(
      Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ).then((response) => {
      if (response === RESULTS.GRANTED) {
        ImagePicker.showImagePicker(
          {
            title: 'Select Image File To Send',
            mediaType: 'photo',
            noData: true,
          },
          (response) => {
            if (!response.didCancel && !response.error && !response.customButton) {
              const source = { uri: response.uri }
              if (response.fileName) {
                source.name = response.fileName
              } else {
                const paths = response.uri.split('/')
                source.name = paths[paths.length - 1]
              }
              if (response.type) {
                source.type = response.type
              } else {
                /** For react-native-image-picker library doesn't return type in iOS,
                 *  it is necessary to force the type to be an image/jpeg (or whatever you're intended to be).
                 */
                if (Platform.OS === 'ios') {
                  source.type = 'image/jpeg'
                }
              }
              onFileButtonPress(channelUrl, isOpenChannel, source)
            }
          },
        )
      } else if (response === RESULTS.DENIED) {
        Permissions.request(
          Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        ).then((response) => {
          _onPhotoAddPress()
        })
      } else {
        Alert.alert('Permission denied', 'You declined the permission to access to your photo.', [{ text: 'OK' }], {
          cancelable: false,
        })
      }
    })
  }

  const _renderList = (rowData) => {
    const message = sbAdjustMessage(rowData.item)
    const { isOpenChannel } = navigation.state.params
    if (message.isUserMessage() || message.isFileMessage()) {
      return (
        <View style={[styles.messageViewStyle]}>
          <View
            style={{
              flexDirection: message.isUser ? 'row-reverse' : 'row',
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <MessageContainer
              isShow={message.sender.isShow}
              isUser={message.isUser}
              nickname={message.sender.nickname}
              message={message}
              time={message.time}
              isEdited={message.isEdited}
              readCount={isOpenChannel || !currentChannel ? 0 : currentChannel.getReadReceipt(message)}
            />
          </View>
        </View>
      )
    } if (message.isAdminMessage()) {
      return <AdminMessage message={message.message} />
    }
    return <View />
  }

  const _renderTyping = () => {
    const { isOpenChannel } = navigation.state.params
    return isOpenChannel ? null : (
      <View style={styles.renderTypingViewStyle}>
        <View style={{ opacity: typing ? 1 : 0, marginRight: 8 }}>
          <BarIndicator count={4} size={10} animationDuration={900} color="#cbd0da" />
        </View>
        <Text style={{ color: '#cbd0da', fontSize: 10 }}>{typing}</Text>
      </View>
    )
  }

  return (
    <View style={styles.containerViewStyle}>
      <Spinner visible={isLoading} />
      <View style={styles.messageListViewStyle}>
        <FlatList
          ref={(elem) => (flatList = elem)}
          renderItem={_renderList}
          data={list}
          keyExtractor={(item) => `${item.messageId}`}
          onEndReachedThreshold={0}
        />
      </View>
      <View style={styles.messageInputViewStyle}>
        {_renderTyping()}
        <MessageInput
          onLeftPress={_onPhotoAddPress}
          onRightPress={_onSendButtonPress}
          textMessage={textMessage}
          onChangeText={_onTextMessageChanged}
        />
      </View>
    </View>
  )
}

Chat.navigationOptions = ({ navigation }) => {
  const { params } = navigation.state
  let newTitle = ''
  if (params.chooseTitle) {
    newTitle = params.chooseTitle
  } else {
    newTitle = `${params.title}${params.memberCount ? `(${params.memberCount})` : null}`
  }
  return {
    title: newTitle,
    headerLeft: (
      <Button
        containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
        buttonStyle={{ paddingLeft: 14 }}
        icon={{
          name: 'chevron-left',
          type: 'font-awesome',
          color: '#7d62d9',
          size: 18,
        }}
        backgroundColor="transparent"
        onPress={() => {
          SendBird.getInstance().removeAllChannelHandlers()
          navigation.goBack()
        }}
      />
    ),
  }
}

export default Chat

const styles = {
  renderTypingViewStyle: {
    flexDirection: 'row',
    marginLeft: 14,
    marginRight: 14,
    marginTop: 4,
    marginBottom: 0,
    paddingBottom: 0,
    height: 14,
  },
  containerViewStyle: {
    backgroundColor: '#f1f2f6',
    flex: 1,
  },
  messageListViewStyle: {
    flex: 10,
    transform: [{ scaleY: -1 }],
  },
  messageInputViewStyle: {
    flex: 1,
    marginBottom: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  messageViewStyle: {
    transform: [{ scaleY: -1 }],
  },
}
