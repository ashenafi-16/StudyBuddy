import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../services/api'

export default function Rooms() {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    API.get('/rooms/').then(res => setRooms(res.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Rooms</h1>
      <div className="space-y-3">
        {rooms.map(room => (
          <Link key={room.id} to={`/rooms/${room.id}`} className="block p-3 border rounded hover:bg-gray-100">
            <h2 className="font-semibold">{room.name}</h2>
            <p className="text-sm text-gray-600">{room.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
