import React, { useState, useEffect, useRef } from 'react';

import genshinImg from '../assets/genshin.webp';
import hsrImg from '../assets/hsr.webp';
import zzzImg from '../assets/zzz.webp';
import wwImg from '../assets/ww.webp';
import endfieldImg from '../assets/endfield.webp';
import nteImg from '../assets/nte.webp';
import heroImg from '../assets/hero.png';

export default function CountdownCard({ event }) {
  const [timeLeft, setTimeLeft] = useState({
    status: 'active', // 'active', 'ended'
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  const [localDates, setLocalDates] = useState({
    start: event.tanggal_mulai,
    end: event.tanggal_berakhir
  });

  const loopTimeoutRef = useRef(null);

  // Sync local dates when props change (unless currently in a local expired transition)
  useEffect(() => {
    setLocalDates({
      start: event.tanggal_mulai,
      end: event.tanggal_berakhir
    });
  }, [event.tanggal_mulai, event.tanggal_berakhir]);

  // Default placeholder images matching the game names if no image URL is provided
  const getPlaceholderImage = (gameName) => {
    const images = {
      'genshin impact': genshinImg,
      'honkai: star rail': hsrImg,
      'zenless zone zero': zzzImg,
      'wuthering waves': wwImg,
      'arknights endfield': endfieldImg,
      'neverness to everness': nteImg
    };
    return images[gameName ? gameName.toLowerCase() : ''] || heroImg;
  };

  const imageSrc = event.gambar && event.gambar.trim() !== '' ? event.gambar : getPlaceholderImage(event.nama_game);

  useEffect(() => {
    const isEndgame = event.kategori && (
      event.kategori.toLowerCase() === 'endgame' || 
      event.kategori.toLowerCase() === 'end game'
    );

    const calculateTime = () => {
      const now = new Date().getTime();
      const startTime = new Date(localDates.start).getTime();
      const endTime = new Date(localDates.end).getTime();

      if (now >= endTime) {
        // Time is up! Display EXPIRED state
        setTimeLeft({
          status: 'ended',
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00'
        });

        // ONLY IF endgame category: After showing EXPIRED for 3 seconds, restart timer for next cycle!
        if (isEndgame && !loopTimeoutRef.current) {
          loopTimeoutRef.current = setTimeout(() => {
            let duration = endTime - startTime;
            if (duration <= 0) {
              duration = 14 * 24 * 60 * 60 * 1000;
            }
            let nextStart = startTime;
            let nextEnd = endTime;
            while (nextEnd <= Date.now()) {
              nextStart += duration;
              nextEnd += duration;
            }
            setLocalDates({
              start: new Date(nextStart).toISOString(),
              end: new Date(nextEnd).toISOString()
            });
            loopTimeoutRef.current = null;
          }, 3000);
        }
      } else {
        // Active countdown - 100% FIXED & UNTOUCHABLE until endTime is reached
        const diff = endTime - now;
        setTimeLeft({
          status: 'active',
          ...formatDiff(diff)
        });
      }
    };

    const formatDiff = (diff) => {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      };
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => {
      clearInterval(interval);
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };
  }, [localDates.start, localDates.end, event.kategori]);

  return (
    <div className="countdown-card">
      <div className="card-details">
        <div className="card-event-name">{event.nama_event}</div>
        
        {timeLeft.status === 'ended' ? (
          <div className="timer-ended">EXPIRED</div>
        ) : (
          <div className="timer-container">
            <div className="timer-segment">
              <div className="timer-box">{timeLeft.days}</div>
              <div className="timer-label">Days</div>
            </div>
            <div className="timer-colon">:</div>
            <div className="timer-segment">
              <div className="timer-box">{timeLeft.hours}</div>
              <div className="timer-label">Hrs</div>
            </div>
            <div className="timer-colon">:</div>
            <div className="timer-segment">
              <div className="timer-box">{timeLeft.minutes}</div>
              <div className="timer-label">Min</div>
            </div>
            <div className="timer-colon">:</div>
            <div className="timer-segment">
              <div className="timer-box">{timeLeft.seconds}</div>
              <div className="timer-label">Sec</div>
            </div>
          </div>
        )}
      </div>
      
      <div 
        className="card-image-bg" 
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
    </div>
  );
}
