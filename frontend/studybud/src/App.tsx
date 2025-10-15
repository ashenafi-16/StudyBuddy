import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Rooms from './pages/Room';
import RoomDetail from './pages/RoomDetail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="p-4 max-w-4xl mx-auto">
        <Routes>
          <Route path="/" element={<Rooms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/rooms/:id"
            element={
              <ProtectedRoute>
                <RoomDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
