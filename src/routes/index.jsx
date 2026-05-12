import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Intro, Register } from '../pages'

function IntroRoute() {
  const navigate = useNavigate()
  return <Intro onComplete={() => navigate('/register')} />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<IntroRoute />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}
