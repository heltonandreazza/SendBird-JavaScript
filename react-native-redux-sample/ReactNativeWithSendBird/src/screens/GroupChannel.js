/* eslint-disable no-param-reassign */
import React, { useState, useLayoutEffect } from 'react'
import {
  View, FlatList, TouchableHighlight, Text, Alert, TextInput,
} from 'react-native'
import Swipeout from 'react-native-swipeout'
import SendBird from 'sendbird'
import {
  Button, ListItem, Avatar, Spinner,
} from '../components'
import {
  sbCreateGroupChannelListQuery,
  sbUnixTimestampToDate,
  sbGetChannelTitle,
  sbGetGroupChannelList,
  sbGetGroupChannel,
  sbLeaveGroupChannel,
  sbCreateGroupChannel,
} from '../sendbirdActions'
import appStateChangeHandler from '../appStateChangeHandler'

const GroupChannel = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [list, setList] = useState([])
  const [inviteUserId, setInviteUserId] = useState(null)

  useLayoutEffect(() => {
    const willFocusSubsription = navigation.addListener('willFocus', () => {
      _initGroupChannelList()
    })
    const appStateHandler = appStateChangeHandler.getInstance().addCallback('GROUP_CHANNEL', () => {
      _initGroupChannelList()
    })

    return () => {
      willFocusSubsription.remove()
      appStateHandler()
    }
  }, [])

  // sendbird
  const initGroupChannel = () => {
    const sb = SendBird.getInstance()
    sb.removeAllChannelHandlers()
  }

  const getGroupChannelList = (groupChannelListQuery) => {
    if (groupChannelListQuery && groupChannelListQuery.hasNext) {
      return sbGetGroupChannelList(groupChannelListQuery)
        .then((channels) => {
          setIsLoading(false)
          setList(channels)
        })
        .catch(() => setIsLoading(false))
    }
    setIsLoading(false)
    return Promise.resolve()
  }
  const onGroupChannelPress = (channelUrl) => sbGetGroupChannel(channelUrl)
    .then((channel) => {
      navigation.navigate('Chat', {
        channelUrl: channel.url,
        title: sbGetChannelTitle(channel),
        memberCount: channel.memberCount,
        isOpenChannel: channel.isOpenChannel(),
      })
    })

  const onLeaveChannelPress = (channelUrl) => sbLeaveGroupChannel(channelUrl)
    .then(() => _getGroupChannelList())
    .catch(() => setIsLoading(false))

  const _initGroupChannelList = () => {
    initGroupChannel()
    _getGroupChannelList()
  }

  const createGroupChannel = (userIdList, isDistinct) => sbCreateGroupChannel(userIdList, isDistinct)
    .then((channel) => {
      setIsLoading(false)
      setInviteUserId('')
      navigation.navigate('Chat', {
        channelUrl: channel.url,
        title: sbGetChannelTitle(channel),
        memberCount: channel.memberCount,
        isOpenChannel: channel.isOpenChannel(),
      })
    })
    .catch((error) => {
      setIsLoading(false)
    })

  const _getGroupChannelList = () => {
    setIsLoading(true)
    const groupChannelListQuery = sbCreateGroupChannelListQuery()
    getGroupChannelList(groupChannelListQuery)
  }

  const _onChannelLeave = (channelUrl) => {
    Alert.alert('Leave', 'Are you sure want to leave channel?', [
      { text: 'Cancel' },
      { text: 'OK', onPress: () => onLeaveChannelPress(channelUrl) },
    ])
  }

  const _renderTitle = (channel) => {
    const { lastMessage } = channel
    return (
      <View style={styles.renderTitleViewStyle}>
        <View style={{ flexDirection: 'row' }}>
          <Text>{sbGetChannelTitle(channel)}</Text>
          <View style={styles.renderTitleMemberCountViewStyle}>
            <Text style={styles.renderTitleTextStyle}>{channel.memberCount}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.renderTitleTextStyle}>{_renderLastMessageTime(lastMessage)}</Text>
        </View>
      </View>
    )
  }

  const _onListItemPress = (channelUrl) => {
    onGroupChannelPress(channelUrl)
  }

  const _renderLastMessageTime = (message) => (message ? sbUnixTimestampToDate(message.createdAt) : null)

  const _renderMessage = (message) => {
    if (message) {
      const lastMessage = message.isFileMessage() ? message.name : message.message
      if (lastMessage.length > 30) {
        return `${lastMessage.substring(0, 27)}...`
      }
      return lastMessage
    }
    return null
  }

  const _renderUnreadCount = (count) => {
    if (count > 0) {
      count = count > 9 ? '+9' : count.toString()
    } else {
      count = null
    }

    return count ? (
      <View style={styles.unreadCountViewStyle}>
        <Text style={styles.unreadCountTextStyle}>{count}</Text>
      </View>
    ) : null
  }

  const _renderLastMessage = (channel) => {
    const { lastMessage, unreadMessageCount } = channel
    return (
      <View style={styles.renderLastMessageViewStyle}>
        <Text style={styles.renderLastMessageTextStyle}>{_renderMessage(lastMessage)}</Text>
        {_renderUnreadCount(unreadMessageCount)}
      </View>
    )
  }

  const _renderList = (rowData) => {
    const channel = rowData.item
    const swipeoutBtns = [
      {
        text: 'Leave',
        type: 'delete',
        onPress: () => {
          _onChannelLeave(channel.url)
        },
      },
    ]
    let avatar = <Avatar />
    if (channel.coverUrl) {
      avatar = <Avatar source={{ uri: channel.coverUrl }} />
    }
    return (
      <Swipeout right={swipeoutBtns} autoClose>
        <ListItem
          component={TouchableHighlight}
          containerStyle={{ backgroundColor: '#fff' }}
          key={channel.url}
          avatar={avatar}
          title={_renderTitle(channel)}
          titleStyle={{ fontWeight: '500', fontSize: 16 }}
          subtitle={_renderLastMessage(channel)}
          subtitleStyle={{ fontWeight: '300', fontSize: 11 }}
          onPress={() => _onListItemPress(channel.url)}
        />
      </Swipeout>
    )
  }

  return (
    <View>
      <Spinner visible={isLoading} />
      <View style={styles.containerCreateChannel}>
        <TextInput
          textFocusColor="#7d62d9"
          textBlurColor="#000"
          highlightColor="#7d62d9"
          borderColor="#d9d9d9"
          style={styles.inputStyle}
          keyboardType="default"
          autoCapitalize="none"
          duration={100}
          autoCorrect={false}
          placeholder="User Id"
          value={inviteUserId}
          maxLength={12}
          onChangeText={setInviteUserId}
        />
        <Button
          containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
          buttonStyle={{ padding: 20, paddingLeft: 16 }}
          iconRight={{
            name: 'user-plus',
            type: 'font-awesome',
            color: '#7d62d9',
            size: 24,
          }}
          backgroundColor="transparent"
          onPress={() => createGroupChannel([inviteUserId], true)}
        />
      </View>
      <FlatList
        renderItem={_renderList}
        data={list}
        keyExtractor={(item) => item.url}
        onEndReachedThreshold={0}
      />
    </View>
  )
}

GroupChannel.navigationOptions = ({ navigation }) => ({
  title: 'Group Channel',
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
      onPress={() => navigation.goBack()}
    />
  ),
  headerRight: (
    <Button
      containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
      buttonStyle={{ paddingLeft: 0, paddingRight: 14 }}
      iconRight={{
        name: 'user-plus',
        type: 'font-awesome',
        color: '#7d62d9',
        size: 18,
      }}
      backgroundColor="transparent"
      onPress={() => {
        navigation.navigate('GroupChannelInvite', {
          title: 'Group Channel Create',
          channelUrl: null,
        })
      }}
    />
  ),
})

export default GroupChannel

const styles = {
  renderTitleViewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  renderTitleMemberCountViewStyle: {
    backgroundColor: '#e3e3e3',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 4,
    marginLeft: 4,
  },
  renderTitleTextStyle: {
    fontSize: 10,
    color: '#878D99',
  },
  unreadCountViewStyle: {
    width: 18,
    height: 18,
    padding: 3,
    backgroundColor: '#e03131',
    borderRadius: 9,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountTextStyle: {
    fontSize: 8,
    fontWeight: '500',
    color: '#fff',
  },
  renderLastMessageViewStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  renderLastMessageTextStyle: {
    fontSize: 12,
    color: '#878D99',
    marginTop: 3,
  },
  containerCreateChannel: {
    display: 'flex',
    flexDirection: 'row',
  },
  inputStyle: {
    flex: 1,
    fontSize: 13,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
}
