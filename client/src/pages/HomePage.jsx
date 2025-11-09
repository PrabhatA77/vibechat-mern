import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSideBar from '../components/RightSideBar'
import { motion } from 'framer-motion'

const HomePage = () => {

  const [selectedUser,setSelectedUser] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.9 }}
      className='w-full h-screen sm:px-[15%] sm:py-[5%]'>
      <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full grid grid-cols-1 relative ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
      <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser}/>
      <ChatContainer selectedUser={selectedUser} setSelectedUser={setSelectedUser}/>
      <RightSideBar selectedUser={selectedUser} setSelectedUser={setSelectedUser}/>
      </div>
    </motion.div>
  )
}

export default HomePage