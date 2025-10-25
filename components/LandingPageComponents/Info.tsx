"use client";
import { useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useIntersectionObserver } from "../../hooks/useInteractionObserver";

function Info() {
  const { ref: headerRef, hasIntersected: headerVisible } = useIntersectionObserver();
  const { ref: cardsRef, hasIntersected: cardsVisible } = useIntersectionObserver();
  const router = useRouter();
  const { isConnected } = useAccount();
  const handleNavigate = useCallback(() => {
    if (!isConnected) {
      return;
    }
    router.push("/dashboard");
  }, [isConnected, router]);

  const predictionCards = [
    {
      id: 1,
      category: "Sports",
      title: "Who will be India's next ODI Captain",
    },
    {
      id: 2,
      category: "GeoPoltics",
      title: "Effect of tariffs on India ft. Nikhil",
    },
    {
      id: 3,
      category: "Life",
      title: "Let's Talk About Longevity",
    },
  ];

  const AnimatedBubbles = () => {
    return (
      <div className="flex items-center justify-between px-4 py-6">
        {/* Speaker Bubble - Left Side */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <Image src="/leader.webp" alt="Speaker" width={100} height={100} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-gray-400 text-xs mt-2">Speaker</span>
        </div>

        {/* Listener Bubbles - Right Side */}
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-2">
            {/* First row of listener bubbles */}
            {[1, 2, 3].map((bubble) => (
              <div key={`bubble-${bubble}`} className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/listnener.jpg"
                  alt="Listener"
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            {/* Second row of listener bubbles */}
            {[4, 5].map((bubble) => (
              <div key={`bubble-${bubble}`} className="w-6 h-6 rounded-full overflow-hidden">
                <Image
                  src="/listnener.jpg"
                  alt="Listener" 
                  className="w-full h-full object-cover"
                  height={100}
                  width={100}
                />
              </div>
            ))}
          </div>
          <span className="text-gray-400 text-xs mt-2">Listeners</span>
        </div>
      </div>
    );
  };

  return (
    <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-green-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-lime-300 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Content Container */}
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center mb-12 lg:mb-16 transition-all duration-700 ease-out ${
            headerVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-lime-400 rounded-full">
            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
            <span className="text-lime-400 text-sm font-medium">Real Time Rewards </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-bold mb-4 px-4">
            Real-time Audio
            <br />
            Content House
          </h2>

          <p className="text-gray-300 text-base sm:text-lg max-w-lg mx-auto px-4">
            People spend hours listening to social media content
            <br className="hidden sm:block" />
            but dont get compensated for this time.
          </p>
        </div>

        {/* Glass Cards Grid */}
        <div
          ref={cardsRef}
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 transition-all duration-700 ease-out delay-200 ${
            cardsVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          {predictionCards.map((card, index) => (
            <div
              key={card.id}
              className={`
                relative bg-black/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6
                hover:border-gray-600/50 transition-all duration-500 hover:bg-black/50
                ${index === 1 ? "lg:transform lg:scale-105 lg:z-10" : ""}
                ${cardsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
              `}
              style={{
                transitionDelay: cardsVisible ? `${index * 200}ms` : "0ms",
              }}
            >
              {/* Category Tag */}
              <div className="inline-flex items-center px-3 py-1 bg-gray-800/60 backdrop-blur-sm rounded-full mb-4">
                <span className="text-gray-300 text-xs font-medium">{card.category}</span>
              </div>

              {/* Title */}
              <h3 className="text-white text-base font-medium mb-6 leading-relaxed">{card.title}</h3>

              <AnimatedBubbles />

              {/* Glassmorphism overlay effect */}
              <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 lg:mt-16">
          <div className="relative group inline-block">
            <button
              type="button"
              disabled={!isConnected}
              onClick={handleNavigate}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 
                ${isConnected
                  ? "bg-lime-400 hover:bg-lime-500 text-black hover:scale-105 hover:shadow-xl hover:shadow-lime-400/30"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"}
              `}
            >
              Join The Conversation
            </button>

            {/* Tooltip when disabled */}
            {!isConnected && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-white text-black text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
                Connect your wallet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Info;