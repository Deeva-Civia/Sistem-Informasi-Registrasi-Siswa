import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeaderBar from "../Molecules/HeaderBar/HeaderBar";
import SidebarMenu from "../Molecules/SidebarMenu/SidebarMenu";
import styles from "./Main.module.css";

const Main = ({
  children,
  showBackButton: showBackButtonProp,
  onBackClick: onBackClickProp,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isProfilePage = /^\/students\/.+/.test(location.pathname);
  const isRegistrationFormPage = /^\/Registration-form(\/|$)/.test(
    location.pathname
  );
  const isDetailLikePageInternal = isProfilePage || isRegistrationFormPage;

  const internalHandleBackClick = () => {
    if (isRegistrationFormPage) {
      navigate("/Registration");
    } else if (isProfilePage) {
      navigate("/students");
    } else {
      navigate(-1);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (isDetailLikePageInternal) {
        setSidebarOpen(false);
        return;
      }

      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDetailLikePageInternal, location.pathname]);

  const finalOnBackClick = onBackClickProp || internalHandleBackClick;
  const finalShowBackButton =
    showBackButtonProp !== undefined
      ? showBackButtonProp
      : isDetailLikePageInternal;

  return (
    <div className={styles.layoutContainer}>
      <HeaderBar
        onHamburgerClick={handleSidebarToggle}
        onBackClick={finalOnBackClick}
        showBackButton={finalShowBackButton}
      />

     
      <SidebarMenu isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className={styles.contentWrapper}>
        <main
          className={`${styles.mainContent} ${
            isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Main;
