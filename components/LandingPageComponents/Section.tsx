import React from 'react'
import Card from './Card'

function Section() {
  const steps = [
    {
      number: "1",
      title: "Create Audio Rooms",
      description: "Set up decentralized audio spaces for real-time conversations and content creation.",
      image: "/api/placeholder/300/200"
    },
    {
      number: "2", 
      title: "Monetize Content",
      description: "Use blockchain technology to earn from your audio content and audience engagement.",
      image: "/api/placeholder/300/200"
    },
    {
      number: "3",
      title: "Build Community", 
      description: "Connect with creators and audiences in a truly decentralized ecosystem.",
      image: "/api/placeholder/300/200"
    }
  ]

  return (
    <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      {/* Content Container */}
      <div className="max-w-screen-lg mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-lime-400 rounded-full">
            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
            <span className="text-lime-400 text-sm font-medium">How YapHouse works</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-bold mb-4 px-4">
            Making audio content,
            <br />
            the decentralized way
          </h2>
          
          <p className="text-gray-300 text-base sm:text-lg max-w-lg mx-auto px-4">
            Create, share, and monetize your audio experiences
            <br className="hidden sm:block" />
            with blockchain technology.
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <Card key={index} step={step} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Section