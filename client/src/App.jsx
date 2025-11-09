import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import FloatingShape from './components/FloatingShape'

const App = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center relative overflow-hidden'>
      <FloatingShape color='bg-purple-500' size='w-64 h-64' top='-5%' left='10%' delay={0}/>
      <FloatingShape color='bg-blue-500' size='w-48 h-48' top='70%' left='80%' delay={5}/>
      <FloatingShape color='bg-indigo-500' size='w-32 h-32' top='40%' left='-10%' delay={2}/>
      <FloatingShape color='bg-violet-500' size='w-24 h-24' top='30%' left='60%' delay={3}/>
      
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/profile' element={<ProfilePage/>}/>
      </Routes>
    </div>
  )
}

export default App