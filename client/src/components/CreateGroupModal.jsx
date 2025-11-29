import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Camera, Check, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import assets from '../assets/assets';

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { axios, authUser } = useContext(AuthContext);
    const [step, setStep] = useState(1);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [groupName, setGroupName] = useState("");
    const [groupImage, setGroupImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setStep(1);
            setSelectedUsers(new Set());
            setGroupName("");
            setGroupImage(null);
            setPreviewImage(null);
            setSearchQuery("");
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleUser = (userId) => {
        setSelectedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGroupImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error("Group name is required");
            return;
        }
        if (selectedUsers.size === 0) {
            toast.error("Select at least one member");
            return;
        }

        const formData = new FormData();
        formData.append("name", groupName);
        formData.append("members", JSON.stringify(Array.from(selectedUsers)));
        if (groupImage) {
            formData.append("profilePic", groupImage);
        }

        setIsCreating(true);
        try {
            const { data } = await axios.post("/api/groups/create", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (data.success) {
                toast.success("Group created successfully");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create group");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredUsers = users.filter(user =>
        !user.isAI && user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#1E1E24] w-full max-w-md rounded-2xl overflow-hidden border border-gray-700 shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#282142]">
                        <h2 className="text-white font-semibold text-lg">
                            {step === 1 ? "Add Members" : "New Group"}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 h-[400px] flex flex-col">
                        {step === 1 ? (
                            <>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#15151A] text-white pl-10 pr-4 py-2 rounded-lg outline-none border border-gray-700 focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleUser(user._id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.has(user._id) ? "bg-indigo-500/20 border border-indigo-500/50" : "hover:bg-white/5 border border-transparent"}`}
                                        >
                                            <div className="relative">
                                                <img src={user.profilePic || assets.avatar_icon} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                {selectedUsers.has(user._id) && (
                                                    <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-0.5 border-2 border-[#1E1E24]">
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{user.name}</p>
                                                <p className="text-gray-400 text-xs truncate">{user.bio || "Available"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-6 pt-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center">
                                        {previewImage ? (
                                            <img src={previewImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={32} className="text-gray-400" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute bottom-0 right-0 bg-indigo-500 p-1.5 rounded-full border-2 border-[#1E1E24]">
                                        <Camera size={14} className="text-white" />
                                    </div>
                                </div>
                                <div className="w-full">
                                    <label className="text-gray-400 text-sm mb-1 block">Group Name</label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="e.g. Weekend Plans"
                                        className="w-full bg-[#15151A] text-white px-4 py-3 rounded-lg outline-none border border-gray-700 focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="w-full">
                                    <p className="text-gray-400 text-sm mb-2">Selected Members: {selectedUsers.size}</p>
                                    <div className="flex -space-x-2 overflow-hidden py-1">
                                        {Array.from(selectedUsers).slice(0, 5).map(uid => {
                                            const u = users.find(u => u._id === uid);
                                            return u ? (
                                                <img key={uid} src={u.profilePic || assets.avatar_icon} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1E1E24] object-cover" alt="" />
                                            ) : null;
                                        })}
                                        {selectedUsers.size > 5 && (
                                            <div className="h-8 w-8 rounded-full bg-gray-700 ring-2 ring-[#1E1E24] flex items-center justify-center text-xs text-white font-medium">
                                                +{selectedUsers.size - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 flex justify-between bg-[#15151A]">
                        {step === 2 ? (
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}
                        <button
                            onClick={() => step === 1 ? setStep(2) : handleCreateGroup()}
                            disabled={(step === 1 && selectedUsers.size === 0) || isCreating}
                            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${(step === 1 && selectedUsers.size === 0) || isCreating
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                                }`}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                step === 1 ? "Next" : "Create Group"
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateGroupModal;
