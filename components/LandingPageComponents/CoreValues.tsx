"use client"

import React from 'react'
import { useIntersectionObserver } from '../../hooks/useInteractionObserver'

function CoreValues() {
  const { ref: headerRef, hasIntersected: headerVisible } = useIntersectionObserver()
  const { ref: gridRef, hasIntersected: gridVisible } = useIntersectionObserver()

  const values = [
    {
      id: 1,
      icon: (
        <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9" />
        </svg>
      ),
      title: "Creators",
      description: "Creators can host their own audio spaces, engage with fans, and earn from their community."
    },
    {
      id: 2,
      icon: (
        <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Listeners",
      description: "Audiences earn while listening, and can engage with creators through NFTs and community features."
    },
    {
      id: 3,
      icon: (
        <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: "Community",
      description: "Host Rooms To Talk To Loyal Members , Launch Your Products For Testing "
    },
    {
      id: 4,
      icon: (
        <svg className="w-8 h-8 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Ownership",
      description: "Platform takes a stepback keeping Creators and Audience Forefront"
    },
  ]

  return (
    <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-black">
      {/* Content Container */}
      <div className="max-w-screen-lg mx-auto">
        {/* Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-12 lg:mb-16 transition-all duration-700 ease-out ${
            headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-lime-400 rounded-full">
            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
            <span className="text-lime-400 text-sm font-medium">Core values</span>
          </div>
          
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-4xl text-white  mb-6 px-4 leading-tight">
            For Everyone,
            <br />
            Designed For Ownership
          </h2>
          
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4 leading-relaxed">
            The main idea behind this product is users are what makes a platform,
            <br className="hidden sm:block" />
            Imagine Youtube without audience the trending media app becomes nothing .
          </p>
        </div>

        {/* Values Grid */}
        <div 
          ref={gridRef}
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-w-3xl mx-auto transition-all duration-700 ease-out delay-200 ${
            gridVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          {values.map((value, index) => (
            <div 
              key={value.id}
              className={`relative bg-black rounded-lg p-3 sm:p-4 transition-all duration-500 hover:border-gray-600/50 shadow-lg hover:shadow-xl overflow-hidden ${
                gridVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ 
                transitionDelay: gridVisible ? `${index * 150}ms` : '0ms' 
              }}
            >
              {/* Shiny overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 via-transparent to-gray-800/10 pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-3">
                  {React.cloneElement(value.icon, { className: "w-6 h-6 text-lime-400" })}
                </div>

                {/* Title */}
                <h3 className="text-white text-sm sm:text-base font-semibold mb-2">
                  {value.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CoreValues