import React, { Component } from 'react'
import {
  Platform, View, FlatList, Text, Alert, BackHandler, Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { NavigationActions } from 'react-navigation'
import Permissions, { PERMISSIONS, RESULTS } from 'react-native-permissions'
import { connect } from 'react-redux'
import { BarIndicator } from 'react-native-indicators'
import ImagePicker from 'react-native-image-picker'
import SendBird from 'sendbird'
import {
  initChatScreen,
  getChannelTitle,
  createChatHandler,
  onSendButtonPress,
  getPrevMessageList,
  onFileButtonPress,
  typingStart,
  typingEnd,
  channelExit,
} from '../actions'
import {
  Button, Spinner, MessageInput, MessageAvatar, AdminMessage, MessageContainer,
} from '../components'
import {
  sbGetGroupChannel,
  sbGetOpenChannel,
  sbCreatePreviousMessageListQuery,
  sbAdjustMessageList,
  sbAdjustMessage,
  sbMarkAsRead,
  sbOpenChannelEnter,
  sbGetChannelTitle,
  sbGetMessageList,
  sbSendTextMessage,
  sbSendFileMessage,
  sbOpenChannelExit,
  sbTypingStart,
  sbTypingEnd,
  sbIsTyping,
} from '../sendbirdActions'
import appStateChangeHandler from '../appStateChangeHandler'

// sendbird
const uniqueList = (list) => list.reduce((uniqList, currentValue) => {
  const ids = uniqList.map((item) => item.messageId)
  if (ids.indexOf(currentValue.messageId) < 0) {
    uniqList.push(currentValue)
  }
  return uniqList
}, [])

const getListMessages = (newMessage) => {
  let foundNewMessage = false
  const sendSuccessList = this.state.list.map((message) => {
    if (message.reqId && newMessage.reqId && message.reqId.toString() === newMessage.reqId.toString()) {
      foundNewMessage = true
      return newMessage
    }
    return message
  })
  if (foundNewMessage) {
    return sendSuccessList
  }
  return [...[newMessage], ...sendSuccessList]
}

class Chat extends Component {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state
    let newTitle = ''
    if (params.chooseTitle) {
      newTitle = params.chooseTitle
    } else {
      newTitle = `${params.newTitle}${params.memberCount ? `(${params.memberCount})` : null}`
    }
    return {
      title: newTitle,
    }
  };

  constructor(props) {
    super(props)
    this.flatList = null
    this.state = {
      channel: null,
      isLoading: false,
      previousMessageListQuery: null,
      textMessage: '',
      // global
      list: [],
      memberCount: 0,
      title: '',
      exit: false,
      typing: '',
      selectedMessages: [],
    }
  }

  componentDidMount() {
    this.willFocusSubsription = this.props.navigation.addListener('willFocus', () => {
      this._init()
    })
    this.appStateHandler = appStateChangeHandler.getInstance().addCallback('CHAT', () => {
      this._init()
    })
    this.props.navigation.setParams({
      handleHeaderLeft: this._onBackButtonPress,
    })
    BackHandler.addEventListener('hardwareBackPress', this._onBackButtonPress)
    this._init()
  }

  componentWillUnmount() {
    this.appStateHandler()
    this.willFocusSubsription.remove()
    BackHandler.removeEventListener('hardwareBackPress', this._onBackButtonPress)
  }

  // sendbird
  registerCommonHandler = (channelHandler, channelUrl) => {
    channelHandler.onMessageReceived = (channel, message) => {
      if (channel.url === channelUrl) {
        if (channel.isGroupChannel()) {
          sbMarkAsRead({ channel })
        }
        this.setState({
          list: uniqueList([...[message], ...this.state.list]),
        })
      }
    }
  }

  registerOpenChannelHandler = (channelUrl) => {
    const sb = SendBird.getInstance()
    const channelHandler = new sb.ChannelHandler()

    this.registerCommonHandler(channelHandler, channelUrl)

    channelHandler.onUserEntered = (channel, user) => {
      if (channel.url === channelUrl) {
        this.setState({
          memberCount: channel.participantCount,
          title: channel.name,
        })
      }
    }
    channelHandler.onUserExited = (channel, user) => {
      if (channel.url === channelUrl) {
        this.setState({
          memberCount: channel.participantCount,
          title: channel.name,
        })
      }
    }

    sb.addChannelHandler(channelUrl, channelHandler)
  }

  registerGroupChannelHandler = (channelUrl) => {
    const sb = SendBird.getInstance()
    const channelHandler = new sb.ChannelHandler()
    this.registerCommonHandler(channelHandler, channelUrl)
    channelHandler.onUserJoined = (channel, user) => {
      if (channel.url === channelUrl) {
        this.setState({
          title: sbGetChannelTitle(channel),
          memberCount: channel.participantCount,
        })
      }
    }
    channelHandler.onUserLeft = (channel, user) => {
      if (channel.url === channelUrl) {
        this.setState({
          title: sbGetChannelTitle(channel),
          memberCount: channel.participantCount,
        })
      }
    }
    channelHandler.onReadReceiptUpdated = (channel) => {
      if (channel.url === channelUrl) {
        this.setState({
          list: this.state.list,
        })
      }
    }
    channelHandler.onTypingStatusUpdated = (channel) => {
      if (channel.url === channelUrl) {
        const typing = sbIsTyping(channel)
        this.setState({
          typing,
        })
      }
    }
    sb.addChannelHandler(channelUrl, channelHandler)
  }

  initChatScreen = () => {
    console.info('OK chatAction -> initChatScreen')
    const sb = SendBird.getInstance()
    sb.removeAllChannelHandlers()
  }

  getChannelTitle = (channelUrl, isOpenChannel) => {
    console.info('OK chatAction -> getChannelTitle')
    if (isOpenChannel) {
      return sbGetOpenChannel(channelUrl)
        .then((channel) => {
          this.setState({
            title: sbGetChannelTitle(channel),
            memberCount: channel.participantCount,
          })
        })
        .catch((err) => {
          console.error(err)
        })
    }
    return sbGetGroupChannel(channelUrl)
      .then((channel) => {
        this.setState({
          title: sbGetChannelTitle(channel),
          memberCount: channel.memberCount,
          // memberCount: channel.participantCount, é o correto?
        })
      })
      .catch((err) => {
        console.error(err)
      })
  }

  createChatHandler = (channelUrl, isOpenChannel) => {
    console.info('OK chatAction -> createChatHandler')
    if (isOpenChannel) {
      return sbGetOpenChannel(channelUrl)
        .then((channel) => {
          sbOpenChannelEnter(channel)
            .then((channel) => {
              this.registerOpenChannelHandler(channelUrl)
            })
            .catch((err) => console.error(err))
        })
        .catch((err) => console.error(err))
    }
    return sbGetGroupChannel(channelUrl)
      .then((channel) => {
        this.registerGroupChannelHandler(channelUrl)
      })
      .catch((err) => console.error(err))
  }

  onSendButtonPress = (channelUrl, isOpenChannel, textMessage) => {
    console.info('OK2 chatAction -> onSendButtonPress')
    if (isOpenChannel) {
      return sbGetOpenChannel(channelUrl)
        .then((channel) => {
          this.sendTextMessage(channel, textMessage)
        })
        .catch((err) => {
          console.error(err)
          const newChatList = this.state.list.slice(1)
          this.setState({ list: newChatList })
        })
    }
    return sbGetGroupChannel(channelUrl)
      .then((channel) => {
        this.sendTextMessage(channel, textMessage)
      })
      .catch((err) => {
        console.error(err)
        const newChatList = this.state.list.slice(1)
        this.setState({ list: newChatList })
      })
  }

  sendTextMessage = (channel, textMessage) => {
    const messageTemp = sbSendTextMessage(channel, textMessage, (message, error) => {
      if (error) {
        console.log(1)
        const newChatList = this.state.list.slice(1)
        this.setState({ list: newChatList })
      }
    })
    console.log(3, messageTemp)
    this.setState({
      list: [...[messageTemp], ...this.state.list],
    })
  }

  onFileButtonPress = (channelUrl, isOpenChannel, source) => {
    console.info('OK chatAction -> onFileButtonPress')
    const openChannelFn = isOpenChannel ? sbGetOpenChannel : sbGetGroupChannel
    return this.sendFileMessageChannel(openChannelFn, channelUrl, source)
  }

  sendFileMessageChannel = (openChannelFn, channelUrl, source) => openChannelFn(channelUrl)
    .then((channel) => this.sendFileMessage(channel, source))
    .then((message) => {
      this.setState({
        list: uniqueList([...[message], ...this.state.list]),
      })
    })

  sendFileMessage = (channel, file) => new Promise((resolve, reject) => {
    sbSendFileMessage(channel, file, (message, error) => {
      if (error) {
        reject(error)
      } else {
        resolve(message)
      }
    })
  })

  typingStart = (channelUrl) => {
    console.info('OK2 chatAction -> typingStart')
    return sbTypingStart(channelUrl)
      .then((response) => console.info('sbTypingStart', response))
      .catch((err) => console.error(err))
  }

  typingEnd = (channelUrl) => {
    console.info('OK chatAction -> typingEnd')
    return sbTypingEnd(channelUrl)
      .then((response) => console.info('typingEnd', response))
      .catch((err) => console.error(err))
  }

  channelExit = (channelUrl, isOpenChannel) => {
    console.info('OK chatAction -> channelExit')
    if (isOpenChannel) {
      return sbGetOpenChannel(channelUrl)
        .then((channel) => {
          sbOpenChannelExit(channel)
            .then((response) => this.setState({ exit: true }))
            .catch((error) => this.setState({ exit: false }))
        })
        .catch((error) => this.setState({ exit: false }))
    }
    const sb = SendBird.getInstance()
    sb.removeChannelHandler(channelUrl)
    this.setState({ exit: true })
    return Promise.resolve(true)
  }

  _init = () => {
    this.initChatScreen()
    const { channelUrl, isOpenChannel } = this.props.navigation.state.params
    if (isOpenChannel) {
      sbGetOpenChannel(channelUrl)
        .then((channel) => this.setState({ channel }, () => this._componentInit()))
    } else {
      sbGetGroupChannel(channelUrl)
        .then((channel) => this.setState({ channel }, () => this._componentInit()))
    }
  };

  _componentInit = () => {
    const { channelUrl, isOpenChannel } = this.props.navigation.state.params
    this.getChannelTitle(channelUrl, isOpenChannel)
    this.createChatHandler(channelUrl, isOpenChannel)
    this._getMessageList(true)
    if (!isOpenChannel) {
      sbMarkAsRead({ channelUrl })
    }
  };

  componentDidUpdate(prevProps, prevStates) {
    const { channelUrl, isOpenChannel } = this.props.navigation.state.params
    const {
      title, memberCount, list, exit, selectedMessages,
    } = this.state

    if (!isOpenChannel) {
      this.state.textMessage ? this.typingStart(channelUrl) : this.typingEnd(channelUrl)
    }

    if (memberCount !== prevStates.memberCount || title !== prevStates.title) {
      const setParamsAction = NavigationActions.setParams({
        params: { memberCount, newTitle: title },
        key: this.props.navigation.state.key,
      })
      this.props.navigation.dispatch(setParamsAction)
    }

    const { params } = this.props.navigation.state
    if ((!selectedMessages || selectedMessages.length === 0) && params.chooseTitle === 'Choose') {
      this.props.navigation.setParams({
        configurableHeaderLeft: undefined,
        configurableHeaderRight: undefined,
        chooseTitle: null,
        newTitle: title,
      })
    }

    if (list !== prevStates.list) {
      this.setState({ isLoading: false })
    }

    if (exit && prevStates.exit !== exit) {
      this.setState({ isLoading: false }, () => {
        this.props.navigation.goBack()
      })
    }
  }

  _onBackButtonPress = () => {
    const { channelUrl, isOpenChannel, _initListState } = this.props.navigation.state.params
    if (_initListState) _initListState()
    this.setState({ isLoading: true }, () => {
      this.channelExit(channelUrl, isOpenChannel)
    })
    return true
  };

  _onTextMessageChanged = (textMessage) => {
    this.setState({ textMessage })
  };

  _getMessageList = async (init) => {
    console.log('_getMessageList')
    // if (!this.state.previousMessageListQuery && !init) {
    //   return
    // }
    const { channelUrl, isOpenChannel } = this.props.navigation.state.params
    this.setState({ isLoading: true })
    try {
      const previousMessageListQuery = await sbCreatePreviousMessageListQuery(channelUrl, isOpenChannel)
      console.info('OK chatAction -> getPrevMessageList')
      if (previousMessageListQuery.hasMore) {
        const messages = await sbGetMessageList(previousMessageListQuery)
        this.setState({
          list: uniqueList(messages),
        })
        this.setState({ isLoading: false })
      }
    } catch (err) {
      console.error(err)
      this.setState({ isLoading: false })
    }
  }

  _onSendButtonPress = () => {
    if (this.state.textMessage) {
      const { channelUrl, isOpenChannel } = this.props.navigation.state.params
      const { textMessage } = this.state
      this.setState({ textMessage: '' }, () => {
        this.onSendButtonPress(channelUrl, isOpenChannel, textMessage)
        if (this.state && this.state.list && this.state.list.length > 0) {
          this.flatList.scrollToIndex({
            index: 0,
            viewOffset: 0,
          })
        }
      })
    }
  };

  _onPhotoAddPress = () => {
    const { channelUrl, isOpenChannel } = this.props.navigation.state.params
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
              this.onFileButtonPress(channelUrl, isOpenChannel, source)
            }
          },
        )
      } else if (response === RESULTS.DENIED) {
        Permissions.request(
          Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        ).then((response) => {
          this._onPhotoAddPress()
        })
      } else {
        Alert.alert('Permission denied', 'You declined the permission to access to your photo.', [{ text: 'OK' }], {
          cancelable: false,
        })
      }
    })
  };

  _selectMessages = (messages) => {
    const sb = SendBird.getInstance()
    return (
      <View style={{ flexDirection: 'row' }}>
        {sb.currentUser.userId === messages[0].sender.userId && (
          <Button
            containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
            buttonStyle={{ paddingLeft: 10, paddingRight: 10 }}
            iconRight={{
              name: 'edit',
              type: 'font-awesome',
              color: '#7d62d9',
              size: 22,
            }}
            backgroundColor="transparent"
            onPress={() => {
              if (this.state.selectedMessages[0].isFileMessage() || this.state.selectedMessages[0].isAdminMessage()) {
                return
              }
              this.setState({
                textMessage: this.state.selectedMessages[0].message,
                editing: true,
              })
            }}
          />
        )}
      </View>
    )
  };

  _renderList = (rowData) => {
    const message = sbAdjustMessage(rowData.item)
    const { isOpenChannel } = this.props.navigation.state.params
    const { channel } = this.state
    if (message.isUserMessage() || message.isFileMessage()) {
      console.log('message', message, message.isUser)
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
            {message.isUser ? (
              <MessageAvatar isShow={message.sender.isShow} uri={message.sender.profileUrl.replace('http://', 'https://')} />
            ) : null}
            <MessageContainer
              isShow={message.sender.isShow}
              isUser={message.isUser}
              nickname={message.sender.nickname}
              message={message}
              time={message.time}
              isEdited={message.isEdited}
              readCount={isOpenChannel || !channel ? 0 : channel.getReadReceipt(message)}
            />
          </View>
        </View>
      )
    } if (message.isAdminMessage()) {
      return <AdminMessage message={message.message} />
    }
    return <View />
  };

  _renderTyping = () => {
    const { isOpenChannel } = this.props.navigation.state.params
    return isOpenChannel ? null : (
      <View style={styles.renderTypingViewStyle}>
        <View style={{ opacity: this.state.typing ? 1 : 0, marginRight: 8 }}>
          <BarIndicator count={4} size={10} animationDuration={900} color="#cbd0da" />
        </View>
        <Text style={{ color: '#cbd0da', fontSize: 10 }}>{this.state.typing}</Text>
      </View>
    )
  };

  _onEditingCancel = () => {
    this.setState({
      textMessage: '',
      editing: false,
    })
    Keyboard.dismiss()
  };

  render() {
    return (
      <View style={styles.containerViewStyle}>
        <Spinner visible={this.state.isLoading} />
        <View style={styles.messageListViewStyle}>
          <FlatList
            ref={(elem) => (this.flatList = elem)}
            renderItem={this._renderList}
            data={this.state.list}
            // extraData={this.state}
            keyExtractor={(item, index) => `${item.messageId}`}
            onEndReached={() => this._getMessageList(false)}
            onEndReachedThreshold={0}
          />
        </View>
        <View style={styles.messageInputViewStyle}>
          {this._renderTyping()}
          <MessageInput
            onLeftPress={this.state.editing ? this._onEditingCancel : this._onPhotoAddPress}
            onRightPress={this.state.editing ? this._onEditingApprove : this._onSendButtonPress}
            editing={this.state.editing}
            textMessage={this.state.textMessage}
            onChangeText={this._onTextMessageChanged}
          />
        </View>
      </View>
    )
  }
}

// function mapStateToProps({ chat }) {
//   let {
//     title, memberCount, list, exit, typing, selectedMessages,
//   } = chat

//   list = sbAdjustMessageList(list)
//   return {
//     title, memberCount, list, exit, typing, selectedMessages,
//   }
// }

export default Chat
// export default connect(
//   mapStateToProps,
//   {
//     initChatScreen,
//     getChannelTitle,
//     createChatHandler,
//     onSendButtonPress,
//     getPrevMessageList,
//     onFileButtonPress,
//     typingStart,
//     typingEnd,
//     channelExit,
//   },
// )(Chat)

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
