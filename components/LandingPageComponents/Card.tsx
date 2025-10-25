import React from 'react'

interface StepProps {
  step: {
    number: string;
    title: string;
    description: string;
    image: string;
  }
}

function Card({ step }: StepProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 h-full">
      {/* Card Image/Content Area */}
      <div className="bg-gray-800 rounded-xl h-48 sm:h-56 lg:h-64 mb-4 sm:mb-6 relative overflow-hidden">
        {/* Mock content based on step number */}
        {step.number === "1" && (
          <div className="absolute inset-0 bg-gradient-to-br from-lime-400 via-yellow-400 to-amber-500 p-4 sm:p-6">
            <div className="text-black font-bold text-base sm:text-lg">Audio</div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="text-black text-xs sm:text-sm">Rooms</span>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-black text-xs sm:text-sm">Content</span>
              </div>
              <div className="flex justify-between text-black text-xs sm:text-sm">
                <span>Create</span>
                <span>Share</span>
              </div>
              <div className="text-right text-black text-xs sm:text-sm mt-2">Monetize</div>
            </div>
          </div>
        )}
        
        {step.number === "2" && (
          <div className="absolute inset-0 bg-gray-700 p-4 sm:p-6">
            <div className="bg-gray-600 rounded-lg h-20 sm:h-32 mb-3 sm:mb-4"></div>
            <div className="space-y-2 sm:space-y-3">
              <div className="bg-gray-600 rounded h-2 sm:h-3"></div>
              <div className="bg-gray-600 rounded h-2 sm:h-3"></div>
              <div className="bg-gray-600 rounded h-2 sm:h-3 w-3/4"></div>
            </div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <div className="bg-lime-400 h-1.5 sm:h-2 rounded-full mb-1 sm:mb-2"></div>
              <div className="flex justify-between text-white text-xs sm:text-sm">
                <span>0</span>
                <span>100%</span>
              </div>
              <div className="bg-lime-400 text-black text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full inline-block mt-1 sm:mt-2">
                Earn rewards
              </div>
            </div>
          </div>
        )}
        
        {step.number === "3" && (
          <div className="absolute inset-0 bg-gray-800 p-4 sm:p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-lime-400 w-16 h-10 sm:w-20 sm:h-12 rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center transform -rotate-12">
                <span className="text-black font-bold text-xs sm:text-sm">Community</span>
              </div>
              <div className="flex justify-center space-x-1 sm:space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-lime-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-lime-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step Number */}
      <div className="text-lime-400 text-xs sm:text-sm font-medium mb-2">
        &lt;Step {step.number}&gt;
      </div>

      {/* Title */}
      <h3 className="text-white text-lg sm:text-xl font-bold mb-2 sm:mb-3">
        {step.title}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
        {step.description}
      </p>
    </div>
  )
}

export default Card