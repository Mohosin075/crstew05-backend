import { Types } from 'mongoose'
import { Token } from './token.model'
import { User } from '../user/user.model'

const logout = async (userId: string) => {
  // Unset deviceToken from user profile upon logout
  await User.findByIdAndUpdate(userId, { $unset: { deviceToken: '' } })

  const res = await Token.updateOne(
    {
      user: new Types.ObjectId(userId),
    },
    {
      expireAt: new Date(Date.now()),
      token: '',
    },
  )

  return res
}
export const TokenServices = {
  logout,
}
