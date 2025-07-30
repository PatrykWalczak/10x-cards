import React, { useState, useRef, useEffect } from "react";
import type { User } from "@supabase/supabase-js";

interface SimpleUserMenuProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export const SimpleUserMenu: React.FC<SimpleUserMenuProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  console.log("SimpleUserMenu render, user:", user);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await onSignOut();
    setIsOpen(false);
    window.location.href = "/auth";
  };

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <a href="/auth" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
          Zaloguj się
        </a>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm font-medium">{user.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black/5 z-50">
          <div className="py-1" role="menu">
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              role="menuitem"
            >
              Profil
            </a>
            <a
              href="/flashcards"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              role="menuitem"
            >
              Moje fiszki
            </a>
            <hr className="my-1" />
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              role="menuitem"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
