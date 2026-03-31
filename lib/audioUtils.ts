/**
 * Audio processing utilities for voice confessions
 * Handles waveform data extraction for visualization
 */

/**
 * Extract waveform data from audio blob for visualization
 * Returns normalized amplitude values between 0 and 1
 */
export const getWaveformData = async (
  audioBlob: Blob,
  samples: number = 100,
): Promise<number[]> => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);

    const blockSize = Math.floor(rawData.length / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      waveform.push(sum / blockSize);
    }

    return waveform;
  } catch (error) {
    console.error("Waveform extraction error:", error);
    return Array(100).fill(0.1);
  }
};
