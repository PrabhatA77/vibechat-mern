import React from 'react'
import assets, { imagesDummyData } from '../assets/assets';
import {motion} from "framer-motion";

const RightSideBar = ({selectedUser}) => {
  return selectedUser && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.9 }}
      className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden":""}`}>
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" 
          className='w-20 aspect-square rounded-full'/>
          <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
            <p className='w-2 h-2 rounded-full bg-green-500'></p>
            {selectedUser.fullName}
          </h1>
          <p className='px-10 mx-auto'>{selectedUser.bio}</p>
      </div>

      <hr className='border-[#ffffff50] my-4'/>

      <div className='px-5 text-xs'>
        <p>Media</p>
        <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
          {imagesDummyData.map((url,index)=>(
            <div key={index} onClick={()=>window.open(url)} className='cursor-pointer rounded'>
              <img src={url} alt="" className='h-full rounded-md'/>
            </div>
          ))}
        </div>
      </div>

      <div className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-purple-300 to-violet-500 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer hover:from-purple-400 hover:to-violet-600'>Logout</div>
    </motion.div>
  )
}

export default RightSideBar