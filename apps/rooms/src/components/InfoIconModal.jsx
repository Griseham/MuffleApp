import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const INFO_MODAL_EVENT = "info-modal-change";

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

function StepCard({ step, isOpen, onToggle, iconColor, isCompact = false }) {
  const [showAll, setShowAll] = useState(false);
  const longText = step.content.length > 450;

  return (
    <div
      style={{
        marginBottom: isCompact ? 14 : 24,
        borderRadius: isCompact ? 10 : 12,
        background: "rgba(255,255,255,0.05)",
        cursor: "pointer",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          padding: isCompact ? "14px 16px" : "20px 24px",
          fontWeight: 600,
          fontSize: isCompact ? "1.05rem" : "1.25rem",
        }}
      >
        {step.icon ? step.icon : <InfoIcon size={20} color={iconColor} />}
        <span style={{ marginLeft: 12 }}>{step.title}</span>
      </div>

      {isOpen && (
        <div style={{ padding: isCompact ? "0 16px 16px 16px" : "0 24px 24px 24px" }}>
          <div
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: !showAll && longText ? (isCompact ? 140 : 160) : "none",
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
  const [uniqueModalId] = useState(
    () =>
      modalId ||
      `modal-${title.replace(/\s/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 11)}`
  );
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

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

  const sidePanelStyles = {
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
    zIndex: 30000,
    animation: "infoModalSlideInRight 0.3s ease-out",
    color: "white",
  };

  useEffect(() => {
    const container = document.createElement("div");
    container.id = `info-modal-portal-${uniqueModalId}`;
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [uniqueModalId]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        window.dispatchEvent(new CustomEvent(INFO_MODAL_EVENT, { detail: null }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const handleModalChange = (event) => {
      setIsModalOpen(event.detail === uniqueModalId);
    };

    window.addEventListener(INFO_MODAL_EVENT, handleModalChange);
    return () => {
      window.removeEventListener(INFO_MODAL_EVENT, handleModalChange);
    };
  }, [uniqueModalId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateViewport = (event) => setIsMobileViewport(event.matches);

    setIsMobileViewport(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  const handleOpenModal = (event) => {
    event.stopPropagation();
    if (isModalOpen) {
      window.dispatchEvent(new CustomEvent(INFO_MODAL_EVENT, { detail: null }));
      return;
    }
    window.dispatchEvent(new CustomEvent(INFO_MODAL_EVENT, { detail: uniqueModalId }));
  };

  const handleCloseModal = () => {
    window.dispatchEvent(new CustomEvent(INFO_MODAL_EVENT, { detail: null }));
  };

  const useMobileSheet = sidePanel && isMobileViewport;

  const modalContent = (
    <>
      <div
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
          padding: useMobileSheet ? "16px 16px 16px 20px" : "20px 28px 20px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(30, 41, 59, 0.40)",
        }}
      >
        <h3
          style={{
            fontSize: useMobileSheet ? "1.25rem" : "1.5rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: 0,
          }}
        >
          <InfoIcon size={20} color={iconColor} />
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
          padding: useMobileSheet ? "12px" : "16px",
          height: useMobileSheet ? "auto" : "calc(100vh - 120px)",
          maxHeight: useMobileSheet ? "calc(82vh - 80px - env(safe-area-inset-bottom, 0px))" : "none",
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
            isCompact={useMobileSheet}
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
        isModalOpen &&
        createPortal(
          sidePanel ? (
            useMobileSheet ? (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.62)",
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  alignItems: "flex-end",
                  zIndex: 30000,
                }}
                onClick={handleCloseModal}
              >
                <div
                  style={{
                    ...sidePanelStyles,
                    top: "auto",
                    right: 0,
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    maxWidth: "100vw",
                    height: "auto",
                    maxHeight: "82vh",
                    borderLeft: "none",
                    borderTop: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "18px 18px 0 0",
                    overflow: "hidden",
                    animation: "slideUpMobile 0.25s ease-out",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {modalContent}
                </div>
              </div>
            ) : (
              <div style={sidePanelStyles} onClick={(event) => event.stopPropagation()}>
                {modalContent}
              </div>
            )
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
                  animation: "modalFadeIn 0.3s ease-out",
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

        @keyframes infoModalSlideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideUpMobile {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
