
/* TestimonialsSection.tsx */
import React from 'react';
import Slider from 'react-slick';
import TestimonialCard from '../TestimonialCard/TestimonialCard';
import './TestimonialsSection.css';

const testimonials = [
  {
    name: 'Dra. Paula Ferreira',
    role: 'Ortodontista',
    message: 'O TopSmile revolucionou minha rotina. A agenda inteligente é maravilhosa!',
    avatar: 'https://i.pravatar.cc/100?img=47',
  },
  {
    name: 'Carlos Mendes',
    role: 'Gerente de Clínica',
    message: 'A interface é super amigável e o suporte é excelente. Recomendo a todos.',
    avatar: 'https://i.pravatar.cc/100?img=60',
  },
  {
    name: 'Dra. Luana Costa',
    role: 'Implantodontista',
    message: 'Agora consigo acompanhar tudo em tempo real, até mesmo do celular.',
    avatar: 'https://i.pravatar.cc/100?img=15',
  },
];

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 7000,
};

const TestimonialsSection: React.FC = () => (
  <section id="testimonials" className="testimonials-section">
    <h2 className="testimonials-title">O que dizem nossos clientes</h2>
    <Slider {...sliderSettings}>
      {testimonials.map((t, idx) => (
        <TestimonialCard key={idx} {...t} />
      ))}
    </Slider>
  </section>
);

export default TestimonialsSection;
