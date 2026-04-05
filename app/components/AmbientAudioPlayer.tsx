"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type SoundscapeType =
  | "rain-piano"
  | "midnight-waves"
  | "deep-space"
  | "music-box"
  | "summer-night"
  | "fireplace"
  | "crystal-caves"
  | "bamboo-chimes"
  | "heartbeat-lullaby"
  | "distant-thunder"
  | "ethereal-choir"
  | "enchanted-forest"
  | "underwater-temple"
  | "desert-wind"
  | "lunar-tide"
  | "gentle-stream"
  | "dopamine-whispers"
  | "midnight-secrets";

const SOUNDSCAPES: { id: SoundscapeType; name: string; icon: string }[] = [
  { id: "rain-piano", name: "Rain & Piano", icon: "🌧️" },
  { id: "midnight-waves", name: "Midnight Waves", icon: "🌊" },
  { id: "deep-space", name: "Deep Space", icon: "🌌" },
  { id: "music-box", name: "Music Box", icon: "🎵" },
  { id: "summer-night", name: "Summer Night", icon: "🦗" },
  { id: "fireplace", name: "Cozy Fireplace", icon: "🔥" },
  { id: "crystal-caves", name: "Crystal Caves", icon: "💎" },
  { id: "bamboo-chimes", name: "Bamboo Chimes", icon: "🎋" },
  { id: "heartbeat-lullaby", name: "Heartbeat", icon: "🫀" },
  { id: "distant-thunder", name: "Thunderstorm", icon: "🌩️" },
  { id: "ethereal-choir", name: "Ethereal Choir", icon: "✨" },
  { id: "enchanted-forest", name: "Enchanted Forest", icon: "🌲" },
  { id: "underwater-temple", name: "Underwater Temple", icon: "💧" },
  { id: "desert-wind", name: "Desert Wind", icon: "🏜️" },
  { id: "lunar-tide", name: "Lunar Tide", icon: "🌑" },
  { id: "gentle-stream", name: "Gentle Stream", icon: "🏞️" },
  { id: "dopamine-whispers", name: "Dopamine Whispers", icon: "🫧" },
  { id: "midnight-secrets", name: "Midnight Secrets", icon: "🌫️" },
];

/**
 * Shared noise generator
 */
function createNoise(
  ctx: AudioContext,
  bufferSize: number,
  type: "pink" | "brown" | "white" = "pink",
) {
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "pink") {
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
  } else if (type === "brown") {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  } else {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

/**
 * Factory for generative soundscapes
 */
function createSoundscape(ctx: AudioContext, type: SoundscapeType) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  const activeNodes: (AudioScheduledSourceNode | { stop: () => void })[] = [];

  // ================= 1. RAIN & PIANO =================
  if (type === "rain-piano") {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.connect(masterGain);
    const padLayers = [
      { freq: 87.31, gain: 0.15 },
      { freq: 130.81, gain: 0.1 },
      { freq: 164.81, gain: 0.08 },
      { freq: 196.0, gain: 0.06 },
      { freq: 220.0, gain: 0.05 },
      { freq: 261.63, gain: 0.04 },
    ];
    for (const { freq, gain } of padLayers) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 15;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + Math.random() * 0.04;
      lfoGain.gain.value = gain * 0.6;
      oscGain.gain.value = gain * 0.5;
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      lfo.start();
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      activeNodes.push(osc, lfo);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoise(ctx, ctx.sampleRate * 2, "pink");
    noiseSource.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 900;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.035;
    const windLfo = ctx.createOscillator();
    const windGain = ctx.createGain();
    windLfo.type = "sine";
    windLfo.frequency.value = 0.1;
    windGain.gain.value = 0.015;
    windLfo.connect(windGain);
    windGain.connect(rainGain.gain);
    windLfo.start();
    noiseSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(masterGain);
    noiseSource.start();
    activeNodes.push(noiseSource, windLfo);

    let loopActive = true;
    const pGain = ctx.createGain();
    pGain.gain.value = 0.45;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.45;
    const fbk = ctx.createGain();
    fbk.gain.value = 0.4;
    const dFilt = ctx.createBiquadFilter();
    dFilt.type = "lowpass";
    dFilt.frequency.value = 1500;
    delay.connect(fbk);
    fbk.connect(dFilt);
    dFilt.connect(delay);
    delay.connect(pGain);
    pGain.connect(masterGain);

    const scale = [
      261.63, 329.63, 349.23, 392.0, 440.0, 523.25, 659.25, 698.46,
    ];
    const playPiano = () => {
      if (!loopActive) return;
      const f = scale[Math.floor(Math.random() * scale.length)];
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.value = f;
      osc2.frequency.value = f * 1.002;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(pGain);
      gain.connect(delay);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 5);
      osc2.stop(ctx.currentTime + 5);
      setTimeout(playPiano, 3000 + Math.random() * 5000);
    };
    setTimeout(playPiano, 1000);
    activeNodes.push({
      stop: () => {
        loopActive = false;
      },
    });
  }

  // ================= 2. MIDNIGHT WAVES =================
  else if (type === "midnight-waves") {
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.15;
    droneGain.connect(masterGain);
    [65.41, 98.0, 130.81].forEach((f) => {
      const pad = ctx.createOscillator();
      pad.frequency.value = f;
      pad.type = "sine";
      pad.connect(droneGain);
      pad.start();
      activeNodes.push(pad);
    });

    const waveSource = ctx.createBufferSource();
    waveSource.buffer = createNoise(ctx, ctx.sampleRate * 4, "pink");
    waveSource.loop = true;
    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = "lowpass";
    const waveGain = ctx.createGain();
    const waveLfo = ctx.createOscillator();
    const lfoFilterGain = ctx.createGain();
    const lfoAmpGain = ctx.createGain();
    waveLfo.frequency.value = 0.05;
    waveFilter.frequency.value = 700;
    lfoFilterGain.gain.value = 500;
    waveLfo.connect(lfoFilterGain);
    lfoFilterGain.connect(waveFilter.frequency);
    waveGain.gain.value = 0.04;
    lfoAmpGain.gain.value = 0.03;
    waveLfo.connect(lfoAmpGain);
    lfoAmpGain.connect(waveGain.gain);
    waveSource.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(masterGain);
    waveLfo.start();
    waveSource.start();
    activeNodes.push(waveSource, waveLfo);
  }

  // ================= 3. DEEP SPACE =================
  else if (type === "deep-space") {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.connect(masterGain);
    const chords = [55.0, 73.42, 110.0, 146.83, 164.81];
    chords.forEach((f) => {
      [1, 1.005, 0.995].forEach((detuneRatio) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = f * detuneRatio;
        osc.type = "sine";
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.02 + Math.random() * 0.03;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.06;
        gain.gain.value = 0.08;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        lfo.start();
        activeNodes.push(osc, lfo);
      });
    });
  }

  // ================= 4. MUSIC BOX =================
  else if (type === "music-box") {
    let loopActive = true;
    const mbDelay = ctx.createDelay();
    mbDelay.delayTime.value = 0.75;
    const mbFeedback = ctx.createGain();
    mbFeedback.gain.value = 0.3;
    mbDelay.connect(mbFeedback);
    mbFeedback.connect(mbDelay);
    mbDelay.connect(masterGain);

    const mbScale = [392.0, 493.88, 523.25, 587.33, 783.99, 880.0];
    const playMusicBox = () => {
      if (!loopActive) return;
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!loopActive) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value =
            mbScale[Math.floor(Math.random() * mbScale.length)];
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
          osc.connect(gain);
          gain.connect(masterGain);
          gain.connect(mbDelay);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.6);
        }, i * 300);
      }
      setTimeout(playMusicBox, 4000 + Math.random() * 3000);
    };
    setTimeout(playMusicBox, 500);
    activeNodes.push({
      stop: () => {
        loopActive = false;
      },
    });
  }

  // ================= 5. SUMMER NIGHT =================
  else if (type === "summer-night") {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.connect(masterGain);
    [164.81, 196.0, 246.94].forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      osc.type = "sine";
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      activeNodes.push(osc);
    });

    const cricketSource = ctx.createBufferSource();
    cricketSource.buffer = createNoise(ctx, ctx.sampleRate, "pink");
    cricketSource.loop = true;
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.value = 6000;
    const cricketGain = ctx.createGain();
    cricketGain.gain.value = 0;
    const chirpLfo = ctx.createOscillator();
    chirpLfo.frequency.value = 35;
    const chirpGain = ctx.createGain();
    chirpGain.gain.value = 0.05;
    chirpLfo.connect(chirpGain);
    chirpGain.connect(cricketGain.gain);
    const swellLfo = ctx.createOscillator();
    swellLfo.frequency.value = 0.2;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.04;
    swellLfo.connect(swellGain);
    swellGain.connect(cricketGain.gain);
    cricketSource.connect(hpFilter);
    hpFilter.connect(cricketGain);
    cricketGain.connect(masterGain);
    cricketSource.start();
    chirpLfo.start();
    swellLfo.start();
    activeNodes.push(cricketSource, chirpLfo, swellLfo);
  }

  // ================= 6. COZY FIREPLACE =================
  else if (type === "fireplace") {
    const fireBase = ctx.createBufferSource();
    fireBase.buffer = createNoise(ctx, ctx.sampleRate * 2, "brown");
    fireBase.loop = true;
    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = "lowpass";
    fireFilter.frequency.value = 400;
    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.15;
    fireBase.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(masterGain);
    fireBase.start();

    let crkActive = true;
    const playCrackle = () => {
      if (!crkActive) return;
      const osc = ctx.createBufferSource();
      osc.buffer = createNoise(ctx, ctx.sampleRate / 4, "pink");
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 4000;
      const crkGain = ctx.createGain();
      crkGain.gain.setValueAtTime(0, ctx.currentTime);
      crkGain.gain.linearRampToValueAtTime(
        0.08 + Math.random() * 0.1,
        ctx.currentTime + 0.01,
      );
      crkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.connect(hp);
      hp.connect(crkGain);
      crkGain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(playCrackle, 50 + Math.random() * 800);
    };
    setTimeout(playCrackle, 500);
    activeNodes.push(fireBase, {
      stop: () => {
        crkActive = false;
      },
    });
  }

  // ================= 7. CRYSTAL CAVES =================
  else if (type === "crystal-caves") {
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.1;
    droneGain.connect(masterGain);
    const d1 = ctx.createOscillator();
    d1.type = "sine";
    d1.frequency.value = 87.31;
    const d2 = ctx.createOscillator();
    d2.type = "sine";
    d2.frequency.value = 130.81;
    d1.connect(droneGain);
    d2.connect(droneGain);
    d1.start();
    d2.start();
    activeNodes.push(d1, d2);

    let cavActive = true;
    const cavesDelay = ctx.createDelay();
    cavesDelay.delayTime.value = 2.0;
    const cFbk = ctx.createGain();
    cFbk.gain.value = 0.6;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3000;
    cavesDelay.connect(cFbk);
    cFbk.connect(lp);
    lp.connect(cavesDelay);
    cavesDelay.connect(masterGain);

    const bells = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    const playBell = () => {
      if (!cavActive) return;
      const f = bells[Math.floor(Math.random() * bells.length)];
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3);
      osc.connect(g);
      g.connect(masterGain);
      g.connect(cavesDelay);
      osc.start();
      osc.stop(ctx.currentTime + 3.1);
      setTimeout(playBell, 4000 + Math.random() * 6000);
    };
    setTimeout(playBell, 1000);
    activeNodes.push({
      stop: () => {
        cavActive = false;
      },
    });
  }

  // ================= 8. BAMBOO CHIMES =================
  else if (type === "bamboo-chimes") {
    const windSource = ctx.createBufferSource();
    windSource.buffer = createNoise(ctx, ctx.sampleRate * 2, "pink");
    windSource.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 600;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.02;
    const wLfo = ctx.createOscillator();
    const wLGain = ctx.createGain();
    wLfo.frequency.value = 0.08;
    wLGain.gain.value = 0.015;
    wLfo.connect(wLGain);
    wLGain.connect(windGain.gain);
    wLfo.start();
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    windSource.start();
    activeNodes.push(windSource, wLfo);

    let bcActive = true;
    const chimes = [293.66, 349.23, 392.0, 440.0, 523.25];
    const strikeChime = () => {
      if (!bcActive) return;
      const strikes = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < strikes; i++) {
        setTimeout(
          () => {
            if (!bcActive) return;
            const osc1 = ctx.createOscillator();
            osc1.type = "square";
            const osc2 = ctx.createOscillator();
            osc2.type = "triangle";
            const f = chimes[Math.floor(Math.random() * chimes.length)];
            osc1.frequency.value = f;
            osc2.frequency.value = f * 1.5;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            osc1.connect(g);
            osc2.connect(g);
            g.connect(masterGain);
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.4);
            osc2.stop(ctx.currentTime + 0.4);
          },
          i * (100 + Math.random() * 150),
        );
      }
      setTimeout(strikeChime, 3000 + Math.random() * 5000);
    };
    setTimeout(strikeChime, 500);
    activeNodes.push({
      stop: () => {
        bcActive = false;
      },
    });
  }

  // ================= 9. HEARTBEAT =================
  else if (type === "heartbeat-lullaby") {
    let hbActive = true;
    const playThump = (time: number, vol: number) => {
      if (!hbActive) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(60, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.4);
    };
    const beat = () => {
      if (!hbActive) return;
      playThump(ctx.currentTime, 0.4);
      playThump(ctx.currentTime + 0.3, 0.25);
      setTimeout(beat, 1200);
    };
    beat();
    activeNodes.push({
      stop: () => {
        hbActive = false;
      },
    });

    const pGain = ctx.createGain();
    pGain.gain.value = 0.05;
    pGain.connect(masterGain);
    [164.81, 207.65, 246.94].forEach((f) => {
      const pad = ctx.createOscillator();
      pad.type = "triangle";
      pad.frequency.value = f;
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.1;
      lg.gain.value = 0.02;
      lfo.connect(lg);
      lg.connect(pGain.gain);
      lfo.start();
      pad.connect(pGain);
      pad.start();
      activeNodes.push(pad, lfo);
    });
  }

  // ================= 10. DISTANT THUNDER =================
  else if (type === "distant-thunder") {
    const rain = ctx.createBufferSource();
    rain.buffer = createNoise(ctx, ctx.sampleRate * 2, "pink");
    rain.loop = true;
    const rLp = ctx.createBiquadFilter();
    rLp.type = "lowpass";
    rLp.frequency.value = 500;
    const rGain = ctx.createGain();
    rGain.gain.value = 0.05;
    rain.connect(rLp);
    rLp.connect(rGain);
    rGain.connect(masterGain);
    rain.start();
    activeNodes.push(rain);

    let thActive = true;
    const thNoise = createNoise(ctx, ctx.sampleRate, "brown");
    const playThunder = () => {
      if (!thActive) return;
      const src = ctx.createBufferSource();
      src.buffer = thNoise;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(
        0.5 + Math.random() * 0.4,
        ctx.currentTime + 0.5,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6);
      src.connect(lp);
      lp.connect(g);
      g.connect(masterGain);
      src.start();
      src.stop(ctx.currentTime + 6.1);
      setTimeout(playThunder, 15000 + Math.random() * 20000);
    };
    setTimeout(playThunder, 5000);
    activeNodes.push({
      stop: () => {
        thActive = false;
      },
    });
  }

  // ================= 11. ETHEREAL CHOIR =================
  else if (type === "ethereal-choir") {
    const choirGain = ctx.createGain();
    choirGain.gain.value = 0;
    choirGain.connect(masterGain);
    const choirFilter = ctx.createBiquadFilter();
    choirFilter.type = "lowpass";
    choirFilter.frequency.value = 2000;
    choirGain.connect(choirFilter);
    const voices = [220.0, 277.18, 329.63, 415.3, 440.0];
    voices.forEach((f) => {
      [1, 1.01, 0.99].forEach((det) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f * det;
        const vib = ctx.createOscillator();
        const vg = ctx.createGain();
        vib.frequency.value = 5 + Math.random();
        vg.gain.value = 2;
        vib.connect(vg);
        vg.connect(osc.frequency);
        vib.start();
        const cg = ctx.createGain();
        cg.gain.value = 0.05;
        const breath = ctx.createOscillator();
        const bg = ctx.createGain();
        breath.frequency.value = 0.05 + Math.random() * 0.02;
        bg.gain.value = 0.04;
        breath.connect(bg);
        bg.connect(cg.gain);
        breath.start();
        osc.connect(cg);
        cg.connect(choirGain);
        osc.start();
        activeNodes.push(osc, vib, breath);
      });
    });
    choirGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 6);
  }

  // ================= 12. ENCHANTED FOREST =================
  else if (type === "enchanted-forest") {
    // 1. Rustling leaves (white noise) instead of heavy sine pad
    const leavesSource = ctx.createBufferSource();
    leavesSource.buffer = createNoise(ctx, ctx.sampleRate, "white");
    leavesSource.loop = true;
    const lFilter = ctx.createBiquadFilter();
    lFilter.type = "bandpass";
    lFilter.frequency.value = 1500;
    lFilter.Q.value = 0.8;
    const lGain = ctx.createGain();
    lGain.gain.value = 0.01;
    const wLfo = ctx.createOscillator();
    wLfo.frequency.value = 0.1;
    const wLGain = ctx.createGain();
    wLGain.gain.value = 0.005;
    wLfo.connect(wLGain);
    wLGain.connect(lGain.gain);
    wLfo.start();
    leavesSource.connect(lFilter);
    lFilter.connect(lGain);
    lGain.connect(masterGain);
    leavesSource.start();
    activeNodes.push(leavesSource, wLfo);

    // 2. Clear delicate bird chirps (no cutting or echo)
    let efActive = true;
    const playBird = () => {
      if (!efActive) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const startF = 4000 + Math.random() * 1000;
      osc.frequency.setValueAtTime(startF, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        startF + 300,
        ctx.currentTime + 0.1,
      );

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(playBird, 2000 + Math.random() * 4000);
    };
    playBird();
    activeNodes.push({ stop: () => (efActive = false) });
  }

  // ================= 13. UNDERWATER TEMPLE =================
  else if (type === "underwater-temple") {
    // Current / bubbling
    const subCurrent = ctx.createBufferSource();
    subCurrent.buffer = createNoise(ctx, ctx.sampleRate * 2, "pink");
    subCurrent.loop = true;
    const curFilter = ctx.createBiquadFilter();
    curFilter.type = "lowpass";
    curFilter.frequency.value = 150;
    const curGain = ctx.createGain();
    curGain.gain.value = 0.15;
    subCurrent.connect(curFilter);
    curFilter.connect(curGain);
    curGain.connect(masterGain);
    subCurrent.start();
    activeNodes.push(subCurrent);

    // Occasional deep resonant bass gong (no loud echo)
    let utActive = true;
    const playGong = () => {
      if (!utActive) return;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 110.0;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4);

      const gongFilter = ctx.createBiquadFilter();
      gongFilter.type = "lowpass";
      gongFilter.frequency.value = 200;
      osc.connect(gain);
      gain.connect(gongFilter);
      gongFilter.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 4.1);
      setTimeout(playGong, 6000 + Math.random() * 6000);
    };
    setTimeout(playGong, 1000);
    activeNodes.push({ stop: () => (utActive = false) });
  }

  // ================= 14. DESERT WIND =================
  else if (type === "desert-wind") {
    const windSource = ctx.createBufferSource();
    windSource.buffer = createNoise(ctx, ctx.sampleRate * 2, "pink");
    windSource.loop = true;
    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = "bandpass";
    bpFilter.Q.value = 2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    bpFilter.frequency.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(bpFilter.frequency);
    const winGain = ctx.createGain();
    winGain.gain.value = 0.05;
    windSource.connect(bpFilter);
    bpFilter.connect(winGain);
    winGain.connect(masterGain);
    windSource.start();
    lfo.start();
    activeNodes.push(windSource, lfo);
  }

  // ================= 15. LUNAR TIDE =================
  else if (type === "lunar-tide") {
    // Pure filtered sweeping noise acting like a massive slow tide, no drone
    const tideSource = ctx.createBufferSource();
    tideSource.buffer = createNoise(ctx, ctx.sampleRate * 2, "pink");
    tideSource.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    lp.frequency.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();

    const ampGain = ctx.createGain();
    ampGain.gain.value = 0.05;
    const lfoAmpGain = ctx.createGain();
    lfoAmpGain.gain.value = 0.04;
    lfo.connect(lfoAmpGain);
    lfoAmpGain.connect(ampGain.gain);

    tideSource.connect(lp);
    lp.connect(ampGain);
    ampGain.connect(masterGain);
    tideSource.start();
    activeNodes.push(tideSource, lfo);
  }

  // ================= 16. GENTLE STREAM =================
  else if (type === "gentle-stream") {
    const streamSource = ctx.createBufferSource();
    streamSource.buffer = createNoise(ctx, ctx.sampleRate, "pink");
    streamSource.loop = true;
    const sFilter = ctx.createBiquadFilter();
    sFilter.type = "bandpass";
    sFilter.frequency.value = 1200;
    sFilter.Q.value = 0.5;
    const sGain = ctx.createGain();
    sGain.gain.value = 0.02;
    streamSource.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(masterGain);
    streamSource.start();
    activeNodes.push(streamSource);

    let gsActive = true;
    const playDroplet = () => {
      if (!gsActive) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1500 + Math.random() * 1000;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(playDroplet, 200 + Math.random() * 500);
    };
    playDroplet();
    activeNodes.push({ stop: () => (gsActive = false) });
  }

  // ================= 17. DOPAMINE WHISPERS =================
  else if (type === "dopamine-whispers") {
    // Deep pad (G maj 9)
    const pG = ctx.createGain();
    pG.gain.value = 0.1;
    pG.connect(masterGain);
    [98.0, 146.83, 185.0, 220.0, 277.18].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + Math.random() * 0.02;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      lfo.connect(g);
      g.connect(pG.gain);
      lfo.start();
      osc.connect(pG);
      osc.start();
      activeNodes.push(osc, lfo);
    });

    // Erratic Heartbeat
    let dwActive = true;
    const playHb = () => {
      if (!dwActive) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
      setTimeout(playHb, 1000 + Math.random() * 500);
    };
    setTimeout(playHb, 500);

    // Whisper noise
    const wSrc = ctx.createBufferSource();
    wSrc.buffer = createNoise(ctx, ctx.sampleRate, "white");
    wSrc.loop = true;
    const wHp = ctx.createBiquadFilter();
    wHp.type = "highpass";
    wHp.frequency.value = 3500;
    const wG = ctx.createGain();
    wG.gain.value = 0;
    const wLfo = ctx.createOscillator();
    wLfo.frequency.value = 0.2;
    const wlG = ctx.createGain();
    wlG.gain.value = 0.015;
    wLfo.connect(wlG);
    wlG.connect(wG.gain);
    wLfo.start();
    wSrc.connect(wHp);
    wHp.connect(wG);
    wG.connect(masterGain);
    wSrc.start();
    activeNodes.push(wSrc, wLfo);

    // Random sparkles
    const playSparkle = () => {
      if (!dwActive) return;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 3000 + Math.random() * 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(playSparkle, 500 + Math.random() * 3000);
    };
    setTimeout(playSparkle, 1500);
    activeNodes.push({ stop: () => (dwActive = false) });
  }

  // ================= 18. MIDNIGHT SECRETS =================
  else if (type === "midnight-secrets") {
    // E minor dark drone
    const mkG = ctx.createGain();
    mkG.gain.value = 0.08;
    mkG.connect(masterGain);
    [82.41, 123.47, 164.81].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03;
      const g = ctx.createGain();
      g.gain.value = 0.08;
      lfo.connect(g);
      g.connect(mkG.gain);
      lfo.start();
      osc.connect(mkG);
      osc.start();
      activeNodes.push(osc, lfo);
    });

    // Close-up crackles (ASMR)
    let msActive = true;
    const playCrak = () => {
      if (!msActive) return;
      if (Math.random() > 0.3) {
        const osc = ctx.createBufferSource();
        osc.buffer = createNoise(ctx, ctx.sampleRate / 10, "brown");
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 6000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        osc.connect(hp);
        hp.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
      setTimeout(playCrak, 20 + Math.random() * 300);
    };
    setTimeout(playCrak, 100);

    // Occasional sharp pluck
    const playPluck = () => {
      if (!msActive) return;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 659.25;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = 5;
      lp.frequency.setValueAtTime(5000, ctx.currentTime);
      lp.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      osc.connect(lp);
      lp.connect(g);
      g.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 1.1);
      setTimeout(playPluck, 5000 + Math.random() * 15000);
    };
    setTimeout(playPluck, 3000);
    activeNodes.push({ stop: () => (msActive = false) });
  }

  // Smooth fade in
  masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);

  return { masterGain, activeNodes, ctx };
}

export default function AmbientAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStyle, setCurrentStyle] =
    useState<SoundscapeType>("rain-piano");
  const [menuOpen, setMenuOpen] = useState(false);

  const padRef = useRef<{
    masterGain: GainNode;
    activeNodes: (AudioScheduledSourceNode | { stop: () => void })[];
    ctx: AudioContext;
  } | null>(null);

  const stopAudio = useCallback(() => {
    if (!padRef.current) return;
    const { masterGain, activeNodes } = padRef.current;

    // Smoothly fade out current track
    try {
      masterGain.gain.linearRampToValueAtTime(
        0,
        padRef.current.ctx.currentTime + 0.8,
      );
      setTimeout(() => {
        for (const node of activeNodes) {
          try {
            node.stop();
          } catch {}
        }
      }, 1000);
    } catch {}

    padRef.current = null;
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback((style: SoundscapeType) => {
    // FIX: If a track is already playing, gracefully shut down only its nodes
    // and instantly switch to the new one utilizing the crossfade.
    if (padRef.current) {
      const oldNodes = padRef.current.activeNodes;
      const oldGain = padRef.current.masterGain;
      const ctx = padRef.current.ctx;

      try {
        oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        setTimeout(() => {
          for (const node of oldNodes) {
            try {
              node.stop();
            } catch {}
          }
        }, 1000);
      } catch {}

      // Do NOT close context, instantly launch new soundscape over it
      padRef.current = createSoundscape(ctx, style);
      setIsPlaying(true);
      return;
    }

    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      padRef.current = createSoundscape(ctx, style);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) stopAudio();
    else playAudio(currentStyle);
  };

  const currentScape = SOUNDSCAPES.find((s) => s.id === currentStyle);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = () => setMenuOpen(false);
    const to = setTimeout(
      () => window.addEventListener("click", handleClick),
      50,
    );
    return () => {
      clearTimeout(to);
      window.removeEventListener("click", handleClick);
    };
  }, [menuOpen]);

  return (
    <div
      className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Soundscape Selector Menu with Gorgeous Glassmorphic UI */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative p-[1.5px] rounded-3xl overflow-hidden origin-bottom-right shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            {/* Extremely smooth sweeping gradient background border */}
            <div
              className="absolute inset-[-100%] animate-[borderSpin_6s_linear_infinite] opacity-60"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, rgba(200,80,140,0.1) 40%, rgba(200,80,140,0.8) 50%, rgba(232,70,124,1) 51%, transparent 70%, transparent 100%)",
              }}
            />

            {/* The inner sleek frosted glass container */}
            <div
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="relative flex flex-col gap-1.5 p-2.5 bg-[#140b12]/85 backdrop-blur-[40px] rounded-[22px] max-h-[60vh] w-[260px] overflow-y-auto no-scrollbar border border-white/[0.05]"
            >
              <div className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                Immersive Soundscapes
              </div>
              {SOUNDSCAPES.map((scape) => (
                <button
                  key={scape.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStyle(scape.id);
                    if (isPlaying && scape.id !== currentStyle) {
                      playAudio(scape.id);
                    }
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-3.5 px-3 py-3.5 rounded-[14px] text-left transition-all whitespace-nowrap overflow-hidden group relative ${
                    currentStyle === scape.id
                      ? "bg-white/[0.12] text-white shadow-inner"
                      : "text-white/40 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span
                    className={`text-xl w-7 text-center transition-transform duration-300 ${currentStyle === scape.id ? "scale-110" : "group-hover:scale-110"}`}
                  >
                    {scape.icon}
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-[0.18em] flex-1 truncate text-shadow-sm">
                    {scape.name}
                  </span>
                  {isPlaying && currentStyle === scape.id && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-white ml-2 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {/* Track Selector Toggle Button */}
        <div
          className="relative rounded-full p-[1.5px] group cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <div
            className={`relative h-12 w-12 rounded-full border border-white/10 backdrop-blur-xl flex items-center justify-center transition-all shadow-xl ${menuOpen ? "bg-black/60 text-white" : "bg-black/20 text-white/50 hover:bg-black/40 hover:text-white"}`}
          >
            {menuOpen ? (
              <VolumeX size={18} className="opacity-0 hidden" />
            ) : (
              <span className="text-xl drop-shadow-md">
                {currentScape?.icon}
              </span>
            )}
            {menuOpen ? (
              <ChevronUp size={18} className="text-white drop-shadow-md" />
            ) : null}
          </div>
        </div>

        {/* Play / Pause Main Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={`relative w-12 h-12 rounded-full border border-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-black/40 hover:border-white/30 transition-all group shadow-xl ${
            isPlaying ? "bg-white/10 text-white" : "bg-black/20 text-white/60"
          }`}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          >
            {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </motion.div>

          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full border border-white/30 pointer-events-none"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeOut" }}
            />
          )}

          {!menuOpen && (
            <div className="absolute right-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-4 py-2 rounded-xl bg-[#140b12]/90 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 shadow-2xl">
              {isPlaying ? "Pause Soundscape" : "Play Soundscape"}
            </div>
          )}
        </motion.button>
      </div>

      <style jsx global>{`
        @keyframes borderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
