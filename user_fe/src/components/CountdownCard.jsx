import React, { useState, useEffect } from 'react';

export default function CountdownCard({ event }) {
  const [timeLeft, setTimeLeft] = useState({
    status: 'active', // 'active', 'ended'
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  // Default placeholder images matching the game names if no image URL is provided
  const getPlaceholderImage = (gameName) => {
    const images = {
      'genshin impact': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60',
      'honkai: star rail': 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop&q=60',
      'zenless zone zero': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=60',
      'wuthering waves': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=60',
      'arknights endfield': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=60',
      'neverness to everness': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=60'
    };
    return images[gameName.toLowerCase()] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60';
  };

  const imageSrc = event.gambar && event.gambar.trim() !== '' ? event.gambar : getPlaceholderImage(event.nama_game);

  useEffect(() => {
    const isEndgame = event.kategori && (
      event.kategori.toLowerCase() === 'endgame' || 
      event.kategori.toLowerCase() === 'end game'
    );

    const calculateTime = () => {
      const now = new Date().getTime();
      let startTime = new Date(event.tanggal_mulai).getTime();
      let endTime = new Date(event.tanggal_berakhir).getTime();

      // If category is endgame and time expired, auto-loop forward seamlessly
      if (isEndgame && now > endTime) {
        let duration = endTime - startTime;
        if (duration <= 0) {
          duration = 14 * 24 * 60 * 60 * 1000;
        }
        while (endTime <= now) {
          startTime += duration;
          endTime += duration;
        }
      }

      if (now > endTime) {
        // Non-endgame event expired
        setTimeLeft({
          status: 'ended',
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00'
        });
      } else {
        // Active event or auto-looped endgame event
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

    return () => clearInterval(interval);
  }, [event.tanggal_mulai, event.tanggal_berakhir, event.kategori]);

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
