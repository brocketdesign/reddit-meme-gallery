import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

function Navigation() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
          <span>Reddit Meme Gallery</span>
        </Link>
        <nav className="ml-auto flex items-center space-x-4">
          <Link 
            to="/search" 
            className="p-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md flex items-center justify-center"
          >
            <FaSearch size={18} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navigation;
