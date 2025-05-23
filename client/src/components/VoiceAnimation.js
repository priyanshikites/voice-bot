import React, { useEffect, useRef, useState } from "react";

const VoiceVisualizer = ({ isActive }) => {
  const [bars, setBars] = useState(new Array(32).fill(0));
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let source;

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;

        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;
        source.connect(analyser);
        animate();
      } catch (error) {
        console.error("Microphone access denied or error:", error);
      }
    };

    const animate = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const normalizedData = Array.from(dataArrayRef.current).map((value) =>
          Math.max(1, value / 5)
        );
        setBars(normalizedData);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    initAudio();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isActive]);

  const renderBarColumn = (barHeights, reverse = false) => {
    const data = reverse ? [...barHeights].reverse() : barHeights;

    return data.map((height, i) => (
      <div
        key={`${reverse ? "L" : "R"}-${i}`}
        className="flex flex-col items-center"
      >
        <div
          className="w-1 bg-[#3b5f83] rounded-t"
          style={{ height: `${height * 2}px` }}
        />
        <div
          className="w-1 bg-[#3b5f83] rounded-b mt-[-0.1px]"
          style={{ height: `${height * 2}px` }}
        />
      </div>
    ));
  };

  return (
    <div className="relative flex items-center justify-center h-[300px] px-4 overflow-hidden">
      <div className="flex items-center gap-1">
        {/* Left mirrored bars */}
        {renderBarColumn(bars, true)}

        {/* Right bars */}
        {renderBarColumn(bars)}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
