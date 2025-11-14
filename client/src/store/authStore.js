import { create } from "zustand";
import axios from "axios";
import { Await } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create(
  (set) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message:null,

    signup: async (email, password, name, bio) => {
      set({ isLoading: true, error: null });
      try {
        const res = await axios.post(`${API_URL}/signup`, {
          email,
          password,
          name,
          bio, // add bio here
        });
        set({
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error.response?.data?.message || "Error Signing Up",
          isLoading: false,
        });
        throw error;
      }
    },

    login: async (email,password)=>{
      set({isLoading:true,error:null})
      try {

        const res = await axios.post(`${API_URL}/login`,{email,password})
        
        set({user:res.data.user,isAuthenticated:true,isLoading:false,error:null})
      } catch (error) {
        set({error:error.response?.data?.message || "Error logging in", isLoading:false})
        throw error;
      }
    },

    logout: async ()=>{
      set({isLoading:true,error:null})
      try {
        await axios.post(`${API_URL}/logout`)
        set({user:null,isAuthenticated:false,error:null,isLoading:false})
      } catch (error) {
        set({error:"Error Logging Out",isLoading:false})
        throw error;
      }
    },

    verifyEmail: async (code) => {
      set({ isLoading: true, error: null });
      try {
        const res = await axios.post(`${API_URL}/verify-email`, {code});
        set({ user: res.data.user, isAuthenticated: true, isLoading: false });
        return res.data;
      } catch (error) {
        set({
          error: error.response?.data?.message || "Error Verifying Email",
          isLoading: false,
        });
        throw error;
      }
    },

    checkAuth: async ()=>{
      set({isCheckingAuth:true,error:null});
      try {
        const res = await axios.get(`${API_URL}/check-auth`);
        set({user:res.data.user , isAuthenticated:true ,isCheckingAuth:false})
      } catch (error) {
        set({error:null,isCheckingAuth:false,isAuthenticated:false});
      }
    },

    forgotPassword:async (email)=>{
      set({isLoading:true,error:null,message:null})
      try {
        const res = await axios.post(`${API_URL}/forgot-password`,{email});
        set({message:res.data.message,isLoading:false})
      } catch (error) {
        set({isLoading:false,error:error.response?.data?.message || "Error Sending Reset Password Email"});
        throw error;
      }
    },

    resetPassword: async (token,password)=>{
      set({isLoading:true,error:null})
      try {
        const res = await axios.post(`${API_URL}/reset-password/${token}`,{password});
        set({message:res.data.message,isLoading:false})
      } catch (error) {
        set({isLoading:false,error:error.response?.data?.message || "Error Resetting Password"})
        throw error;
      }
    }

  })
);
