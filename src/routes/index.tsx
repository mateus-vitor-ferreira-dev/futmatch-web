import { BrowserRouter, Routes } from 'react-router-dom'

import { arvoreDeRotas } from './arvore'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>{arvoreDeRotas}</Routes>
    </BrowserRouter>
  )
}
