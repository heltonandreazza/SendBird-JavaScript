import { combineReducers } from 'redux'
import chat from './chatReducer'
import member from './memberReducer'
import blockUser from './blockUserReducer'
import groupChannelInvite from './groupChannelInviteReducer'

export default combineReducers({
  chat,
  member,
  blockUser,
  groupChannelInvite,
})

export chatReducer from './chatReducer'
export memberReducer from './memberReducer'
export blockUserReducer from './blockUserReducer'
export groupChannelInviteReducer from './groupChannelInviteReducer'
