import React from "react";
import Navbar from "./LandingPageComponents/Navbar";
import Hero from "./LandingPageComponents/Hero";
import Info from "./LandingPageComponents/Info";
import CoreValues from "./LandingPageComponents/CoreValues";
import FAQs from "./LandingPageComponents/FAQs";
import Footer from "./LandingPageComponents/Footer";

const LandingPage = () => {
  return (
    <main className="min-h-screen w-full bg-black relative overflow-hidden">
      <Navbar />
      <section id="home">
        <Hero />
      </section>
      <section id="rooms">
        <Info />
      </section>
      <section id="core-values">
        <CoreValues />
      </section>
      <section id="about">
        <FAQs />
        <Footer />
      </section>
    </main>
  );
};

export default LandingPage;