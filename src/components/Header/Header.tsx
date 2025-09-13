// src/components/Header/EnhancedHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../UI/Button/Button';
import './Header.css';

interface NavLink {
  label: string;
  to: string;
  icon?: React.ReactNode;
}

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: Date;
  }>;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  onNotificationClick?: (notificationId: string) => void;
  onLogout?: () => void;
}

const navLinks: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Benefícios', to: '/features' },
  { label: 'Preços', to: '/pricing' },
  { label: 'Contato', to: '/contact' },
];

const EnhancedHeader: React.FC<HeaderProps> = ({
  user,
  notifications = [],
  showSearch = false,
  onSearch,
  onNotificationClick,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const location = useLocation();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Touch event handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Close mobile menu on left swipe
    if (isLeftSwipe && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // Open mobile menu on right swipe from left edge
    if (isRightSwipe && !isMobileMenuOpen && touchStart < 50) {
      setIsMobileMenuOpen(true);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    onNotificationClick?.(notificationId);
    setIsNotificationsOpen(false);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const MenuIcon = () => (
    <svg className="header__menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="header__menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const SearchIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );

  const BellIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  const UserIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
  );

  return (
    <>
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      
      <header className="header" role="banner">
        <div className="container">
          {/* Skip Links for Accessibility */}
          <a href="#main-content" className="skip-link">
            Pular para conteúdo principal
          </a>
          <a href="#main-navigation" className="skip-link">
            Pular para navegação principal
          </a>

          {/* Logo */}
          <div className="header__logo">
            <Link to="/" className="header__logo-link" aria-label="TopSmile - Página inicial">
              <img
                src="/src/assets/images/icon-192x192.png"
                alt="TopSmile"
                className="header__logo-img"
              />
              <span className="header__logo-text">TopSmile</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav id="main-navigation" className="header__nav hide-mobile" role="navigation" aria-label="Navegação principal">
            <ul className="header__nav-list">
              {navLinks.map(link => (
                <li key={link.label} className="header__nav-item">
                  <Link 
                    to={link.to} 
                    className={`header__nav-link ${location.pathname === link.to ? 'header__nav-link--active' : ''}`}
                    aria-current={location.pathname === link.to ? 'page' : undefined}
                  >
                    {link.icon && <span className="header__nav-icon">{link.icon}</span>}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search Bar */}
          {showSearch && (
            <div className="header__search hide-mobile">
              <form onSubmit={handleSearch} className="header__search-form">
                <div className="header__search-input-group">
                  <SearchIcon />
                  <input
                    type="search"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="header__search-input"
                    aria-label="Buscar"
                  />
                </div>
              </form>
            </div>
          )}

          {/* Actions */}
          <div className="header__actions">
            {/* Notifications */}
            {user && notifications.length > 0 && (
              <div className="header__notifications" ref={notificationsRef}>
                <button
                  className="header__notifications-button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
                  aria-expanded={isNotificationsOpen}
                  aria-haspopup="true"
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="header__notifications-badge" aria-hidden="true">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="header__notifications-dropdown" role="menu" aria-label="Notificações">
                    <div className="header__notifications-header">
                      <h3>Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="header__notifications-count">
                          {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="header__notifications-list">
                      {notifications.slice(0, 5).map(notification => (
                        <button
                          key={notification.id}
                          className={`header__notification-item ${!notification.read ? 'header__notification-item--unread' : ''}`}
                          onClick={() => handleNotificationClick(notification.id)}
                          role="menuitem"
                        >
                          <div className="header__notification-content">
                            <h4 className="header__notification-title">{notification.title}</h4>
                            <p className="header__notification-message">{notification.message}</p>
                          </div>
                          <span className="header__notification-time">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {notifications.length > 5 && (
                      <div className="header__notifications-footer">
                        <Link to="/notifications" className="header__notifications-view-all">
                          Ver todas as notificações
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="header__user-menu" ref={userMenuRef}>
                <button
                  className="header__user-button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label={`Menu do usuário: ${user.name}`}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="header__user-avatar" />
                  ) : (
                    <div className="header__user-avatar header__user-avatar--placeholder">
                      <UserIcon />
                    </div>
                  )}
                  <div className="header__user-info hide-mobile">
                    <span className="header__user-name">{user.name}</span>
                    {user.role && (
                      <span className="header__user-role">{user.role}</span>
                    )}
                  </div>
                  <ChevronDownIcon />
                </button>

                {isUserMenuOpen && (
                  <div className="header__user-dropdown" role="menu" aria-label="Menu do usuário">
                    <div className="header__user-dropdown-header">
                      <div className="header__user-dropdown-info">
                        <span className="header__user-dropdown-name">{user.name}</span>
                        {user.role && (
                          <span className="header__user-dropdown-role">{user.role}</span>
                        )}
                      </div>
                    </div>
                    <div className="header__user-dropdown-divider"></div>
                    <Link
                      to="/profile"
                      className="header__user-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon />
                      Perfil
                    </Link>
                    <Link
                      to="/settings"
                      className="header__user-dropdown-item"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      Configurações
                    </Link>
                    <div className="header__user-dropdown-divider"></div>
                    <button
                      className="header__user-dropdown-item header__user-dropdown-item--danger"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout?.();
                      }}
                    >
                      <LogoutIcon />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header__auth-buttons hide-mobile">
                <Link to="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Começar</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="header__mobile-menu-button show-mobile"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu de navegação"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="header__mobile-menu show-mobile"
            ref={mobileMenuRef}
            role="navigation"
            aria-label="Menu de navegação móvel"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {showSearch && (
              <div className="header__mobile-search">
                <form onSubmit={handleSearch} className="header__search-form">
                  <div className="header__search-input-group">
                    <SearchIcon />
                    <input
                      type="search"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="header__search-input"
                      aria-label="Buscar"
                    />
                  </div>
                </form>
              </div>
            )}
            
            <nav className="header__mobile-nav">
              <ul className="header__mobile-nav-list">
                {navLinks.map(link => (
                  <li key={link.label} className="header__mobile-nav-item">
                    <Link 
                      to={link.to} 
                      className={`header__mobile-nav-link ${location.pathname === link.to ? 'header__mobile-nav-link--active' : ''}`}
                      aria-current={location.pathname === link.to ? 'page' : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon && <span className="header__nav-icon">{link.icon}</span>}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {!user && (
              <div className="header__mobile-auth">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" fullWidth>Entrar</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth>Começar</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default EnhancedHeader;