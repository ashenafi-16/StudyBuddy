import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('access')

  const handleLogout = () => {
    localStorage.removeItem('access')
    navigate('/login')
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <Link to="/" className="font-bold text-xl">StudyBud</Link>
      <div>
        {token ? (
          <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link to="/register" className="bg-green-500 px-3 py-1 rounded">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
