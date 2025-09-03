import React from 'react';
import Header from '../../components/Header/Header';
import Hero from '../../components/Hero/Hero';
import FeaturesSection from '../../components/Features/FeaturesSection/FeaturesSection';
import PricingSection from '../../components/Pricing/PricingSection/PricingSection';
import ContactForm from '../../components/ContactForm/ContactForm';
import TestimonialSection from '../../components/Testimonials/TestimonialSection/TestimonialSection';

import Footer from '../../components/Footer/Footer';

const Home: React.FC = () => (
  <div className="font-sans text-gray-800">
    <Header />
    <Hero />
    <FeaturesSection />
    <PricingSection />
    <ContactForm />
    <TestimonialSection />
    <Footer />
  </div>
);

export default Home;
