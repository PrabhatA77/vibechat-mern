import React from "react";
import zxcvbn from "zxcvbn";
import { motion, AnimatePresence } from "framer-motion";

const PasswordStrengthMeter = ({ password }) => {
  const hasPassword = password && password.length > 0;

  // Analyze password only if exists
  const testResult = hasPassword
    ? zxcvbn(password)
    : { score: 0, feedback: { suggestions: [] } };

  const score = testResult.score;

  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colorClasses = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-400",
    "bg-green-600",
  ];
  const strengthPercent = ["20%", "40%", "60%", "80%", "100%"];

  return (
    <div className="mt-3">
      {/* Render the meter only when password is typed*/}
      <AnimatePresence>
        {hasPassword && (
          <motion.div
            key="strength-meter"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: strengthPercent[score] }}
                exit={{ width: "0%" }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className={`h-2 rounded ${colorClasses[score]}`}
                aria-hidden
              />
            </div>

            {/* Strength label */}
            <p className="text-sm mt-1 text-gray-600 font-medium">
              Strength:{" "}
              <span className={`${colorClasses[score]} text-white px-2 py-0.5 rounded`}>
                {strengthLabels[score]}
              </span>
            </p>

            {/* Feedback suggestions */}
            {testResult.feedback.suggestions.length > 0 && (
              <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                {testResult.feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordStrengthMeter;