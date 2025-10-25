"use client"

import { useEffect, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import Image from "next/image";

function Navbar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Show navbar after hero section animation completes
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.offsetTop - navbarHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center ">
            {/* <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-green-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-sm"></div>
            </div> */}
            <Image src="/logo.png" width={70} height={70} alt="icon" />
            <span className="text-white font-bold text-2xl">YAPhouse</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('home')}
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105 transform"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('rooms')}
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105 transform"
            >
              Rooms
            </button>
            <button
              onClick={() => scrollToSection('core-values')}
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105 transform"
            >
              Core Values
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale-105 transform"
            >
              About Us
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Wallet />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:text-lime-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-700/50 mt-4">
            <div className="px-6 py-4 space-y-4">
              <button
                onClick={() => scrollToSection("home")}
                className="block text-gray-300 hover:text-white transition-colors duration-200 w-full text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("rooms")}
                className="block text-gray-300 hover:text-white transition-colors duration-200 w-full text-left"
              >
                Rooms
              </button>
              <button
                onClick={() => scrollToSection("core-values")}
                className="block text-gray-300 hover:text-white transition-colors duration-200 w-full text-left"
              >
                Core Values
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="block text-gray-300 hover:text-white transition-colors duration-200 w-full text-left"
              >
                About Us
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar