import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { t } from '../utils/translations';
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const isSeller = localStorage.getItem("isSeller");
  const userName = localStorage.getItem("userName") || "User";
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "ml", name: "മലയാളം", flag: "🇮🇳" }
  ];

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang.name);
    localStorage.setItem("language", lang.name);
    localStorage.setItem("languageCode", lang.code);
    setShowLanguageDropdown(false);
    // Force re-render to update text
    window.location.reload();
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.name === language) || languages[0];
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand" onClick={() => navigate("/dashboard")}>
          <span className="brand-icon">🏛️</span>
          <span className="brand-text">{t('brand')}</span>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">
            <span className="nav-icon">📊</span>
            {t('dashboard')}
          </Link>

          {isSeller === "true" && (
            <Link to="/create-auction" className="nav-link">
              <span className="nav-icon">➕</span>
              {t('createAuction')}
            </Link>
          )}

          {isSeller === "true" && (
            <Link to="/my-sales" className="nav-link">
              <span className="nav-icon">💼</span>
              {t('mySales')}
            </Link>
          )}

          <Link to="/auctions" className="nav-link">
            <span className="nav-icon">🔍</span>
            {t('auctions')}
          </Link>

          {isSeller === "false" && (
            <Link to="/my-purchases" className="nav-link">
              <span className="nav-icon">🛍️</span>
              {t('myPurchases')}
            </Link>
          )}

          <Link to="/bidding-stats" className="nav-link">
            <span className="nav-icon">📊</span>
            My Stats
          </Link>

          <Link to="/watchlist" className="nav-link">
            <span className="nav-icon">⭐</span>
            {t('watchlist')}
          </Link>

          {/* Language Selector */}
          <div className="language-selector">
            <button 
              className="language-toggle" 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              title={t('changeLanguage')}
            >
              <span className="language-flag">{getCurrentLanguage().flag}</span>
              <span className="language-name">{getCurrentLanguage().name}</span>
              <span className={`language-arrow ${showLanguageDropdown ? 'open' : ''}`}>▼</span>
            </button>

            {showLanguageDropdown && (
              <div className="language-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-item ${language === lang.name ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <span className="language-flag">{lang.flag}</span>
                    <span className="language-text">{lang.name}</span>
                    {language === lang.name && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? t('lightMode') : t('darkMode')}>
            <span className="theme-icon">
              {darkMode ? "☀️" : "🌙"}
            </span>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="navbar-user">
          <div 
            className="user-profile" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="user-avatar">
              {isSeller === "true" ? "👨‍💼" : "👤"}
            </div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">
                {isSeller === "true" ? t('seller') : t('buyer')}
              </span>
            </div>
            <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <span className="dropdown-icon">👤</span>
                {t('myProfile')}
              </Link>
              <Link to="/my-bids" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <span className="dropdown-icon">💰</span>
                {t('myBids')}
              </Link>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout-btn" onClick={handleLogout}>
                <span className="dropdown-icon">🚺</span>
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
