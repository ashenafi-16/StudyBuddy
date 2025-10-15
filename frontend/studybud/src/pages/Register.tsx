import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function Register() {
  const [formData, setFormData] = useState({ email: '', username: '', password: '' })
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await API.post('/auth/register/', formData)
      localStorage.setItem('access', res.data.tokens.access)
      navigate('/')
    } catch (err) {
      alert('Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <input
        type="text"
        placeholder="Username"
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        className="border p-2 w-full mb-3"
      />
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="border p-2 w-full mb-3"
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="border p-2 w-full mb-3"
      />
      <button type="submit" className="bg-green-500 text-white p-2 w-full">Register</button>
    </form>
  )
}
