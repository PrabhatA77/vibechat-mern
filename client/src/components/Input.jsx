import React, { useState } from 'react';
import {Eye,EyeOff} from "lucide-react";

const Input = ({icon:Icon,type,...props}) => {

  const [showPassword,setShowPassword] = useState(false);

  //if this input is not password then render normal input
  const isPassword = type === "password";

  return (
    <div className='relative mb-6'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Icon className='w-5 h-5 text-violet-300'/>
        </div>
        <input {...props} 
        type={isPassword ? (showPassword?'text':'password'):type}
        className='w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-40 rounded-lg border border-[#2a2540] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 text-white placeholder-violet-200 transition duration-200'
        />

        {/* password toggle icon */}
        {isPassword && (
          <div
            className='absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer'
            onClick={()=>setShowPassword((prev)=>!prev)}
          >
            {showPassword ? (
              <EyeOff className='w-5 h-5 text-violet-300'/>
            ):(
              <Eye className='w-5 h-5 text-violet-300' />
            )}
          </div>
        )}
    </div>
  )
}

export default Input;