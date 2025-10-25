"use client"

import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useIntersectionObserver } from '../../hooks/useInteractionObserver'

function FAQs() {
  const { ref: headerRef, hasIntersected: headerVisible } = useIntersectionObserver()
  const { ref: accordionRef, hasIntersected: accordionVisible } = useIntersectionObserver()

  return (
    <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      {/* Content Container */}
      <div className="max-w-screen-lg mx-auto">
        <div 
          ref={headerRef}
          className={`text-center mb-12 lg:mb-16 transition-all duration-700 ease-out ${
            headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-lime-400 rounded-full">
            <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
            <span className="text-lime-400 text-sm font-medium">Some FAQ&apos;s</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-semibold mb-4 px-4">
            Everything You Need
            <br />
            To Know
          </h2>
        </div>
        
        {/* FAQ Content */}
        <div 
          ref={accordionRef}
          className={`max-w-3xl mx-auto transition-all duration-700 ease-out delay-200 ${
            accordionVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <AccordionDemo/>
        </div>
      </div>
    </div>
  )
}

export default FAQs

export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-base text-white sm:text-lg font-medium text-left">
          How Decentralization comes into picture
        </AccordionTrigger>
        <AccordionContent className="text-sm sm:text-base font-light text-gray-300">
          YapHouse lets audience earn and keep badges owned by them not by the platform unlike in youtube or instagram memberships.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger className="text-base text-white sm:text-lg font-medium text-left">
          How YapHouse makes money
        </AccordionTrigger>
        <AccordionContent className="text-sm sm:text-base font-light text-gray-300">
          YapHouse earns through gas fees NFTs and subscription models
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <AccordionTrigger className="text-base text-white sm:text-lg font-medium text-left">
          If You Support Subscriptions How it is different from Youtube
        </AccordionTrigger>
        <AccordionContent className="text-sm sm:text-base font-light text-gray-300">
          Youtube takes cut from revenue of superchats and memberships, whereas YapHouse only takes fee for using these services, and the revenue made through it goes to the creator.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-6">
        <AccordionTrigger className="text-base text-white sm:text-lg font-medium text-left">
          Is it on mainnet?
        </AccordionTrigger>
        <AccordionContent className="text-sm sm:text-base font-light text-gray-300">
          No not currently but we are working on it. 
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
  