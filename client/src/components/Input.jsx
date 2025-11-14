import React from 'react'

const Input = ({icon:Icon,...props}) => {
  return (
    <div className='relative mb-6'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Icon className='w-5 h-5 text-violet-300'/>
        </div>
        <input {...props} 
        className='w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-40 rounded-lg border border-[#2a2540] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 text-white placeholder-violet-200 transition duration-200'
        />
    </div>
  )
}

export default Input;