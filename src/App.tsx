/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CallNowModal } from './components/CallNowModal';
import { ContactSection } from './components/ContactSection';
import { FloatingActions } from './components/FloatingActions';
import { Footer } from './components/Footer';
import { FreeTrialSection } from './components/FreeTrialSection';
import { GymGallerySection } from './components/GymGallerySection';
import { HeroSection } from './components/HeroSection';
import { MembershipSection } from './components/MembershipSection';
import { Navbar } from './components/Navbar';
import { TrainersSection } from './components/TrainersSection';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main>
        <HeroSection />
        <FreeTrialSection />
        <GymGallerySection />
        <TrainersSection />
        <MembershipSection />
        <ContactSection />
      </main>
      <Footer />
      <FloatingActions />
      <CallNowModal />
    </div>
  );
}
