import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const INFO_MODAL_EVENT = "info-modal-change";
const CLOSE_ANIMATION_MS = 260;

export const InfoIcon = ({ size = 18, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path d="M12 16v-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const XIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function StepCard({ step, isOpen, onToggle, iconColor }) {
  const [showAll, setShowAll] = useState(false);
  const longText = step.content.length > 450;

  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 12,
        background: "rgba(255,255,255,0.05)",
        cursor: "pointer",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "20px 24px",
          fontWeight: 600,
          fontSize: "1.25rem",
        }}
      >
        {step.icon ? step.icon : <InfoIcon size={20} color={iconColor} />}
        <span style={{ marginLeft: 12 }}>{step.title}</span>
      </div>

      {isOpen && (
        <div style={{ padding: "0 24px 24px 24px" }}>
          <div
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: !showAll && longText ? 160 : "none",
              overflow: !showAll && longText ? "hidden" : "visible",
              lineHeight: 1.7,
            }}
          >
            {step.content}
          </div>

          {longText && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowAll(!showAll);
              }}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: "#FFA500",
                cursor: "pointer",
                fontSize: "0.95rem",
                padding: 0,
              }}
            >
              {showAll ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function InfoIconModal({
  title = "Information",
  steps = [],
  iconSize = 18,
  iconColor = "#FFA500",
  buttonText = "Info",
  showButtonText = true,
  sidePanel = true,
  modalId = null,
  buttonClassName = "",
  buttonStyle = null,
  ariaLabel = "Information",
}) {
  const [openIndex, setOpenIndex] = useState(0);
  const [portalContainer, setPortalContainer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRenderModal, setShouldRenderModal] = useState(false);
  const closeTimerRef = useRef(null);
  const [uniqueModalId] = useState(
    () =>
      modalId ||
      `modal-${title.replace(/\s/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 11)}`
  );

  const modalSteps =
    steps.length > 0
      ? steps
      : [
          {
            icon: <InfoIcon size={20} color={iconColor} />,
            title,
            content: "No content provided. Please pass content through the steps prop.",
          },
        ];

  useEffect(() => {
    const container = document.createElement("div");
    container.id = `info-modal-portal-${uniqueModalId}`;
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [uniqueModalId]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const handleModalChange = (event) => {
      const shouldOpen = event.detail === uniqueModalId;

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      if (shouldOpen) {
        setIsClosing(false);
        setShouldRenderModal(true);
        setIsModalOpen(true);
      } else {
        if (!isModalOpen && !shouldRenderModal) return;
        setIsModalOpen(false);
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => {
          setIsClosing(false);
          setShouldRenderModal(false);
          closeTimerRef.current = null;
        }, CLOSE_ANIMATION_MS);
      }
    };

    window.addEventListener(INFO_MODAL_EVENT, handleModalChange);
    return () => {
      window.removeEventListener(INFO_MODAL_EVENT, handleModalChange);
    };
  }, [uniqueModalId, isModalOpen, shouldRenderModal]);

  const handleOpenModal = (event) => {
    event.stopPropagation();
    window.dispatchEvent(
      new CustomEvent(INFO_MODAL_EVENT, {
        detail: isModalOpen ? null : uniqueModalId,
      })
    );
  };

  const handleCloseModal = () => {
    window.dispatchEvent(new CustomEvent(INFO_MODAL_EVENT, { detail: null }));
  };

  const modalContent = (
    <>
      <div
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
          padding: "20px 28px 20px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(30, 41, 59, 0.40)",
        }}
      >
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: 0,
          }}
        >
          {title}
        </h3>

        <button
          type="button"
          onClick={handleCloseModal}
          aria-label="Close"
          style={{
            border: "none",
            cursor: "pointer",
            display: "flex",
            padding: "4px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <XIcon size={18} color="white" />
        </button>
      </div>

      <div
        style={{
          padding: "16px",
          height: "calc(100vh - 120px)",
          overflowY: "auto",
        }}
      >
        {modalSteps.map((step, index) => (
          <StepCard
            key={`${title}-${index}`}
            step={step}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            iconColor={iconColor}
          />
        ))}
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`info-icon-button ${buttonClassName}`.trim()}
        aria-label={ariaLabel}
        aria-expanded={isModalOpen}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: showButtonText ? "8px 16px" : "8px",
          borderRadius: showButtonText ? "24px" : "50%",
          zIndex: 25000,
          ...buttonStyle,
        }}
      >
        <InfoIcon size={iconSize} color={iconColor} />
        {showButtonText && (
          <span
            style={{
              fontSize: "0.875rem",
              color: "white",
              fontWeight: 500,
            }}
          >
            {buttonText}
          </span>
        )}
      </button>

      {portalContainer &&
        shouldRenderModal &&
        createPortal(
          sidePanel ? (
            <div
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                height: "100vh",
                width: "clamp(280px, 25%, 360px)",
                background:
                  "radial-gradient(circle at 20% 30%, rgba(34, 34, 34, 0.95) 0%, rgba(17, 17, 17, 0.98) 50%, rgba(0, 0, 0, 0.99) 100%)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
                overflowY: "auto",
                backdropFilter: "blur(8px)",
                zIndex: 15000,
                animation: isClosing ? "slideOutRight 0.26s ease-in forwards" : "slideInRight 0.3s ease-out",
                color: "white",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {modalContent}
            </div>
          ) : (
            <div
              className="modal-backdrop"
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(2px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 11000,
                animation: isClosing ? "backdropFadeOut 0.2s ease-in forwards" : "backdropFadeIn 0.2s ease-out",
              }}
              onClick={handleCloseModal}
            >
              <div
                className="modal-content"
                style={{
                  background:
                    "radial-gradient(circle at 20% 30%, rgba(34, 34, 34, 0.95) 0%, rgba(17, 17, 17, 0.98) 50%, rgba(0, 0, 0, 0.99) 100%)",
                  borderRadius: "16px",
                  maxWidth: "600px",
                  width: "90%",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  position: "relative",
                  color: "white",
                  animation: isClosing ? "modalFadeOut 0.2s ease-in forwards" : "modalFadeIn 0.3s ease-out",
                }}
                onClick={(event) => event.stopPropagation()}
              >
                {modalContent}
              </div>
            </div>
          ),
          portalContainer
        )}

      <style>{`
        .info-icon-button {
          background-color: rgba(30, 41, 59, 0.8);
          border: none;
          cursor: pointer;
        }

        .info-icon-button svg {
          display: block;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes modalFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }

        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes backdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </>
  );
}
