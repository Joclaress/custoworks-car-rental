import React from 'react';
import { ContactSection } from '../components/ContactSection';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <ContactSection isStandalonePage={true} />
    </div>
  );
};
