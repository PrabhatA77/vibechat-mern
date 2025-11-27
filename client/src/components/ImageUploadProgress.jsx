// src/components/ImageUploadProgress.jsx

import React from "react";
import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const ImageUploadProgress = ({ progress, onCancel }) => {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">

      {/* Circular Progress */}
      <CircularProgressbar
        value={progress}
        strokeWidth={8}
        styles={buildStyles({
          pathColor: "#6d5dfc",
          trailColor: "rgba(255,255,255,0.2)",
        })}
      />

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="absolute w-7 h-7 rounded-full bg-[#00000099] text-white flex items-center justify-center text-sm"
      >
        ✕
      </button>
    </div>
  );
};

export default ImageUploadProgress;
