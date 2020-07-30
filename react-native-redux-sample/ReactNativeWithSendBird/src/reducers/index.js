import { combineReducers } from 'redux'
import chat from './chatReducer'
import member from './memberReducer'
import blockUser from './blockUserReducer'
import groupChannel from './groupChannelReducer'
import groupChannelInvite from './groupChannelInviteReducer'

export default combineReducers({
  chat,
  member,
  blockUser,
  groupChannel,
  groupChannelInvite,
})

export chatReducer from './chatReducer'
export memberReducer from './memberReducer'
export blockUserReducer from './blockUserReducer'
export groupChannelReducer from './groupChannelReducer'
export groupChannelInviteReducer from './groupChannelInviteReducer'
