import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function verifyAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    return payload
  } catch (e) {
    return e
  }
}
