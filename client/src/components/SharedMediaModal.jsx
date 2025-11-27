import React, { useEffect, useState, useContext } from "react";
import { X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const SharedMediaModal = ({ isOpen, onClose, selectedUser }) => {
    const { axios } = useContext(AuthContext);
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !selectedUser) return;

        const fetchMedia = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
                if (data.success) {
                    const images = data.messages.filter((msg) => msg.image);
                    setMedia(images);
                }
            } catch (error) {
                console.error("Failed to fetch media:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, [isOpen, selectedUser, axios]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#282142] w-full max-w-md rounded-xl border border-gray-600 overflow-hidden flex flex-col max-h-[80vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-600">
                        <h3 className="text-lg font-semibold text-white">Shared Media</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : media.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {media.map((msg) => (
                                    <div
                                        key={msg._id}
                                        onClick={() => window.open(msg.image, "_blank")}
                                        className="aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:opacity-80 transition"
                                    >
                                        <img
                                            src={msg.image}
                                            alt="shared"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <p>No media shared yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SharedMediaModal;
