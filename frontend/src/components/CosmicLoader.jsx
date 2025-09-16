import React from "react";

/**
 * Cosmic-themed loading component
 */
const CosmicLoader = ({
  size = 60,
  variant = "default",
  message = "",
  className = "",
}) => {
  const getLoaderStyle = () => {
    const baseStyle = {
      width: `${size}px`,
      height: `${size}px`,
      margin: "0 auto",
      borderRadius: "50%",
    };

    switch (variant) {
      case "claiming":
        return {
          ...baseStyle,
          border: "3px solid rgba(255, 107, 157, 0.2)",
          borderTop: "3px solid #ff6b9d",
          animation:
            "cosmic-spin 0.8s linear infinite, pulse-glow 2s ease-in-out infinite",
        };
      case "success":
        return {
          ...baseStyle,
          border: "3px solid rgba(100, 255, 218, 0.2)",
          borderTop: "3px solid #64ffda",
          animation: "cosmic-spin 1.2s linear infinite",
        };
      default:
        return {
          ...baseStyle,
          border: "3px solid rgba(100, 255, 218, 0.2)",
          borderTop: "3px solid #64ffda",
          animation: "cosmic-spin 1s linear infinite",
        };
    }
  };

  return (
    <div className={`cosmic-loader-container ${className}`}>
      <div className="cosmic-loader" style={getLoaderStyle()} />
      {message && <p className="cosmic-loader-message">{message}</p>}

      <style jsx>{`
        .cosmic-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0;
        }

        .cosmic-loader {
          position: relative;
        }

        .cosmic-loader-message {
          margin-top: 1rem;
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
          text-align: center;
          animation: fade-in-out 0.5s ease-in-out;
        }

        @keyframes cosmic-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(255, 107, 157, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 107, 157, 0.6);
          }
        }

        @keyframes fade-in-out {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CosmicLoader;
