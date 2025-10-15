import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import API from '../services/api'

export default function RoomDetail() {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [body, setBody] = useState('')

  useEffect(() => {
    API.get(`/rooms/${id}/`).then(res => setRoom(res.data))
  }, [id])

  const sendMessage = async () => {
    await API.post('/messages/', { room: id, body })
    setBody('')
    const updated = await API.get(`/rooms/${id}/`)
    setRoom(updated.data)
  }

  if (!room) return <p>Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{room.name}</h1>
      <p className="mb-4">{room.description}</p>

      <div className="space-y-2 mb-4">
        {room.participants.map(p => (
          <span key={p.id} className="inline-block bg-gray-200 px-2 py-1 rounded mr-2">{p.username}</span>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type message..."
        className="border p-2 w-full mb-2"
      ></textarea>
      <button onClick={sendMessage} className="bg-blue-500 text-white p-2 w-full">Send</button>
    </div>
  )
}
