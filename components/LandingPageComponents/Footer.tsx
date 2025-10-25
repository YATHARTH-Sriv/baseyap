"use client"

import Link from 'next/link';
import React from 'react'
import { FaTwitter, FaGithub} from "react-icons/fa";
import { useIntersectionObserver } from '../../hooks/useInteractionObserver'

const socials = [
  {
    id: 1,
    logo: <FaTwitter className="text-xl text-blue-500" />,
    link: "https://x.com/yatharth_sriv"
  },
  {
    id: 2,
    logo: <FaGithub className="text-xl text-white " />,
    link: "https://github.com/yatharth-sriv"
  }
];

function Footer() {
  const { ref: footerRef, hasIntersected: footerVisible } = useIntersectionObserver()

  return (
    <div 
      ref={footerRef}
      className={`w-full flex justify-center gap-4 mt-12 py-12 transition-all duration-700 ease-out ${
        footerVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {socials.map(({ id, logo, link }, index) => (
        <Link 
          key={id} 
          href={link} 
          target="_blank" 
          className={`hover:bg-white/10 p-3 rounded-full transition-all duration-500 ${
            footerVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ 
            transitionDelay: footerVisible ? `${index * 100}ms` : '0ms' 
          }}
        >
          {logo}
        </Link>
      ))}
    </div>
  )
}

export default Footer