import SendBird from 'sendbird'

export const sbGetChannelTitle = (channel) => {
  if (channel.isOpenChannel()) {
    console.info('sbGetChannelTitle isOpenChannel resolved', channel)
    return channel.name
  }
  const { members } = channel
  let nicknames = members
    .map((member) => member.nickname)
    .join(', ')

  if (nicknames.length > 21) {
    nicknames = `${nicknames.substring(0, 17)}...`
  }
  console.info('sbGetChannelTitle resolved', channel)
  return nicknames
}

/**
 * Enchance message data by adding time, readCount and isUser
 */
export const sbAdjustMessage = (messageList, i) => {
  const message = messageList
  message.time = sbUnixTimestampToDate(message.createdAt)
  message.readCount = 0
  if (message.isUserMessage() || message.isFileMessage()) {
    message.isUser = message.sender.userId === SendBird.getInstance().getCurrentUserId()
  } else {
    message.isUser = false
  }
  // if (message.sender) {
  //   message.sender.isShow = true
  //   if (!message.sender.profileUrl) {
  //     message.sender.profileUrl = 'default-image'
  //   }
  // }

  // if (i < list.length - 1) {
  //   const prevMessage = list[i + 1]
  //   if (message.isUserMessage() || message.isFileMessage()) {
  //     if (prevMessage.isUserMessage() || prevMessage.isFileMessage()) {
  //       if (prevMessage.sender.userId === message.sender.userId) {
  //         message.sender.isShow = false
  //       }
  //     }
  //   }
  // }
  return message
}

export const sbAdjustMessageList = (list) => {
  const messages = list.map(sbAdjustMessage)
  console.info('sbAdjustMessageList resolved', messages)
  return messages
}

export const sbUnixTimestampToDate = (unixTimestamp) => {
  const today = new Date()
  const date = new Date(unixTimestamp)

  if (today.getMonth() !== date.getMonth() || today.getDay() !== date.getDay()) {
    return `${date.getMonth()}/${date.getDay()}`
  }
  const hour = `0${date.getHours()}`
  const minute = `0${date.getMinutes()}`
  return `${hour.substr(-2)}:${minute.substr(-2)}`
}
