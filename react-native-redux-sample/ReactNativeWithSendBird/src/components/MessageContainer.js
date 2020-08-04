import React from 'react'
import { View, Text } from 'react-native'
import { MessageBubble } from './MessageBubble'

const _renderUnreadCount = (readCount) => (readCount ? <Text style={{ fontSize: 10, color: '#f03e3e' }}>{readCount}</Text> : null)

const MessageContainer = ({
  isUser, isShow, nickname, message, time, isEdited, readCount,
}) => (
  <View style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
    <MessageBubble
      isShow={isShow}
      isUser={isUser}
      nickname={nickname}
      message={message}
      time={time}
      isEdited={isEdited}
    />
    <View
      style={{
        flexDirection: 'column-reverse',
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      {isUser ? _renderUnreadCount(readCount) : null}
    </View>
  </View>
)

const styles = {}

export { MessageContainer }
