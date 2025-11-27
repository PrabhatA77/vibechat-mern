import React, { useState, useContext,useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";   // ✅ IMPORT

const ProfilePage = () => {

  const navigate = useNavigate();

  const { updateProfile , authUser } = useContext(AuthContext);    // ✅ FIXED HERE

  const [selectedImage, setSelectedImage] = useState(null);
  const [preview,setPreview] = useState(null);

  const [name, setName] = useState(authUser.name);
  const [bio, setBio] = useState(authUser.bio);

  const [loading,setLoading] = useState(false);

  //load existing user data
  useEffect(()=>{
    if(authUser){
      setName(authUser.name || "");
      setBio(authUser.bio || "");
      setPreview(authUser.profilePic || null);
    }
  },[authUser])

  //display image preview
  useEffect(()=>{
    if(!selectedImage) return ;
    const objectUrl = URL.createObjectURL(selectedImage);
    setPreview(objectUrl);
    return ()=> URL.revokeObjectURL(objectUrl);
  },[selectedImage]);

  const handleSubmit = async(e) => {
    e.preventDefault();

    setLoading(true);

    try {
      //prepare data
      const data = new FormData();
      data.append("name",name);
      data.append("bio",bio);
      if(selectedImage) data.append("avatar",selectedImage);

      //update profile
      await updateProfile(data);
      toast.success("Profile updated successfully")

      navigate("/");

    } catch (error) {
      toast.error("Failed to update profile!")
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-10 flex flex-col md:flex-row items-center gap-8 w-[90%] max-w-2xl relative"
    >
      {/* Profile Form Section */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 text-white w-full md:w-1/2"
      >
        <h3 className="text-2xl font-semibold mb-2">Profile Details</h3>

        {/* Profile Image Upload */}
        <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">
          <input
            type="file"
            id="avatar"
            accept=".png, .jpg, .jpeg"
            hidden
            onChange={(e) => setSelectedImage(e.target.files[0])}
          />

          <motion.img
            src={preview || assets.avatar_icon}
            alt="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`w-12 h-12 rounded-full border border-gray-300`}
          />
          <span className="text-sm text-gray-300">upload profile image</span>
        </label>

        {/* Name Input */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Your Name"
          required
          className="p-3 bg-transparent border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/* Bio Input */}
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write profile bio"
          rows={3}
          required
          className="p-3 bg-transparent border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        ></textarea>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-linear-to-r from-purple-400 to-violet-600 hover:from-violet-500 hover:to-purple-700 text-white py-2 rounded-full text-lg font-semibold transition-all duration-300"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>

      {/* Right Side Logo */}
      <div className="flex justify-center items-center md:w-1/2">
        <img src={assets.logo} alt="VibeChat logo" className="w-40 h-40 object-contain" />
      </div>
    </motion.div>
  );
};

export default ProfilePage;
