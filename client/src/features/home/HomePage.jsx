import { useEffect } from 'react';
import Hero from './sections/Hero.jsx';
import Philosophy from './sections/Philosophy.jsx';
import SignaturePies from './sections/SignaturePies.jsx';
import BuilderCta from './sections/BuilderCta.jsx';
import FounderStory from './sections/FounderStory.jsx';
import TrackingTeaser from './sections/TrackingTeaser.jsx';

export default function HomePage() {
  useEffect(() => { document.title = 'Forno & Farina | Wood-fired pizza'; }, []);
  return (
    <>
      <Hero />
      <Philosophy />
      <SignaturePies />
      <BuilderCta />
      <FounderStory />
      <TrackingTeaser />
    </>
  );
}
